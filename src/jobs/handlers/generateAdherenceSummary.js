const prisma = require('../../lib/prisma');
const logger = require('../../lib/logger');
const { computeAdherence, previousCompletedWeek, previousCompletedMonth } = require('../../lib/adherence');

async function generateAdherenceSummaryHandler() {
  const patients = await prisma.user.findMany({ where: { role: 'PATIENT' } });

  let written = 0;
  for (const patient of patients) {
    const periods = [
      previousCompletedWeek(patient.timezone),
      previousCompletedMonth(patient.timezone),
    ];

    for (const { periodStart, periodEnd } of periods) {
      const { takenCount, missedCount, adherenceRate } = await computeAdherence(
        patient.id,
        periodStart,
        periodEnd
      );

      if (takenCount + missedCount === 0) continue;

      await prisma.adherenceSummary.upsert({
        where: { patientId_periodStart_periodEnd: { patientId: patient.id, periodStart, periodEnd } },
        create: {
          patientId: patient.id,
          periodStart,
          periodEnd,
          takenCount,
          missedCount,
          adherenceRate,
        },
        update: { takenCount, missedCount, adherenceRate, generatedAt: new Date() },
      });
      written += 1;
    }
  }

  logger.info({ patientsChecked: patients.length, summariesWritten: written }, 'generate_adherence_summary: complete');
  return { patientsChecked: patients.length, summariesWritten: written };
}

module.exports = generateAdherenceSummaryHandler;
