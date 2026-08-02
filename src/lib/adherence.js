const { DateTime } = require('luxon');
const prisma = require('./prisma');

async function computeAdherence(patientId, periodStart, periodEnd) {
  const where = {
    schedule: { medication: { patientId } },
    scheduledTime: { gte: periodStart, lt: periodEnd },
    status: { in: ['TAKEN', 'TAKEN_LATE', 'MISSED'] },
  };

  const [takenCount, missedCount] = await Promise.all([
    prisma.intakeLog.count({ where: { ...where, status: { in: ['TAKEN', 'TAKEN_LATE'] } } }),
    prisma.intakeLog.count({ where: { ...where, status: 'MISSED' } }),
  ]);

  const total = takenCount + missedCount;
  const adherenceRate = total > 0 ? takenCount / total : null;

  return { periodStart, periodEnd, takenCount, missedCount, adherenceRate };
}

async function getLiveAdherence(patientId, period, timezone, now = new Date()) {
  const nowLocal = DateTime.fromJSDate(now, { zone: timezone });
  const start =
    period === 'monthly' ? nowLocal.startOf('month') : nowLocal.startOf('week');

  return computeAdherence(patientId, start.toUTC().toJSDate(), now);
}

function previousCompletedWeek(timezone, now = new Date()) {
  const nowLocal = DateTime.fromJSDate(now, { zone: timezone });
  const thisWeekStart = nowLocal.startOf('week');
  const periodStart = thisWeekStart.minus({ weeks: 1 });
  const periodEnd = thisWeekStart;
  return { periodStart: periodStart.toUTC().toJSDate(), periodEnd: periodEnd.toUTC().toJSDate() };
}

function previousCompletedMonth(timezone, now = new Date()) {
  const nowLocal = DateTime.fromJSDate(now, { zone: timezone });
  const thisMonthStart = nowLocal.startOf('month');
  const periodStart = thisMonthStart.minus({ months: 1 });
  const periodEnd = thisMonthStart;
  return { periodStart: periodStart.toUTC().toJSDate(), periodEnd: periodEnd.toUTC().toJSDate() };
}

module.exports = {
  computeAdherence,
  getLiveAdherence,
  previousCompletedWeek,
  previousCompletedMonth,
};
