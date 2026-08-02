const { DateTime } = require('luxon');
const prisma = require('../../lib/prisma');
const logger = require('../../lib/logger');
const { sendSms } = require('../../lib/smsGateway');
const { computeAdherence, previousCompletedWeek } = require('../../lib/adherence');

async function sendWeeklyDigestHandler() {
  const caregivers = await prisma.user.findMany({ where: { role: 'CAREGIVER' } });

  let caregiversNotified = 0;
  for (const caregiver of caregivers) {
    const links = await prisma.patientCaregiverLink.findMany({
      where: { caregiverId: caregiver.id, status: 'ACTIVE' },
      include: { patient: true },
    });
    if (links.length === 0) continue;

    const lines = [];
    for (const link of links) {
      const { patient } = link;
      const thisWeek = previousCompletedWeek(patient.timezone);
      const priorWeekStart = DateTime.fromJSDate(thisWeek.periodStart, { zone: 'utc' })
        .minus({ weeks: 1 })
        .toJSDate();

      const [current, prior] = await Promise.all([
        computeAdherence(patient.id, thisWeek.periodStart, thisWeek.periodEnd),
        computeAdherence(patient.id, priorWeekStart, thisWeek.periodStart),
      ]);

      if (current.takenCount + current.missedCount === 0) continue;

      const currentPct = Math.round((current.adherenceRate ?? 0) * 100);
      const trendPoints =
        prior.adherenceRate !== null ? currentPct - Math.round(prior.adherenceRate * 100) : null;
      const trendStr =
        trendPoints === null ? '' : trendPoints >= 0 ? ` (+${trendPoints}pt vs last wk)` : ` (${trendPoints}pt vs last wk)`;

      lines.push(`${patient.name}: ${currentPct}% adherence${trendStr}, ${current.missedCount} missed`);
    }

    if (lines.length === 0 || !caregiver.phone) continue;

    const body = `MediMate weekly digest:\n${lines.join('\n')}`;
    await sendSms(caregiver.phone, body);
    caregiversNotified += 1;
  }

  logger.info({ caregiversNotified }, 'send_weekly_digest: complete');
  return { caregiversNotified };
}

module.exports = sendWeeklyDigestHandler;
