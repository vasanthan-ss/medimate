const { DateTime } = require('luxon');
const { Prisma } = require('@prisma/client');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');
const { enqueueSendReminder, enqueueCheckConfirmation } = require('../queue/producers');

function toSchemaWeekday(luxonWeekday) {
  return luxonWeekday % 7;
}

function isDueNow(schedule, timezone, referenceUtc) {
  const local = DateTime.fromJSDate(referenceUtc, { zone: timezone });
  const [hh, mm] = schedule.timeOfDay.split(':').map(Number);
  return (
    schedule.daysOfWeek.includes(toSchemaWeekday(local.weekday)) &&
    local.hour === hh &&
    local.minute === mm
  );
}

function computeOccurrenceTimestamp(schedule, timezone, referenceUtc) {
  const local = DateTime.fromJSDate(referenceUtc, { zone: timezone });
  const [hh, mm] = schedule.timeOfDay.split(':').map(Number);
  return local.set({ hour: hh, minute: mm, second: 0, millisecond: 0 }).toUTC().toJSDate();
}

async function upsertIntakeLog(schedule, occurrenceTime) {
  try {
    return await prisma.intakeLog.create({
      data: {
        scheduleId: schedule.id,
        scheduledTime: occurrenceTime,
        gracePeriodMinutes: schedule.gracePeriodMinutes,
        status: 'PENDING',
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return prisma.intakeLog.findUniqueOrThrow({
        where: { scheduleId_scheduledTime: { scheduleId: schedule.id, scheduledTime: occurrenceTime } },
      });
    }
    throw err;
  }
}

async function scheduleDueReminders(now = new Date()) {
  const schedules = await prisma.schedule.findMany({
    where: { active: true, medication: { deletedAt: null } },
    include: { medication: { include: { patient: true } } },
  });

  let enqueuedCount = 0;
  for (const schedule of schedules) {
    const { patient } = schedule.medication;
    if (!isDueNow(schedule, patient.timezone, now)) continue;

    const occurrenceTime = computeOccurrenceTimestamp(schedule, patient.timezone, now);
    const intakeLog = await upsertIntakeLog(schedule, occurrenceTime);

    await enqueueSendReminder(intakeLog);
    const delayMs =
      occurrenceTime.getTime() + schedule.gracePeriodMinutes * 60_000 - Date.now();
    await enqueueCheckConfirmation(intakeLog, { delayMs });

    enqueuedCount += 1;
    logger.info(
      { scheduleId: schedule.id, intakeLogId: intakeLog.id, occurrenceTime },
      'cron: reminder cycle enqueued'
    );
  }

  return { schedulesChecked: schedules.length, enqueuedCount };
}

module.exports = { scheduleDueReminders, isDueNow, computeOccurrenceTimestamp, upsertIntakeLog };
