const cron = require("node-cron");
const prisma = require("../config/prisma");

const DAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const getTodayCode = () => {
  return DAY_CODES[new Date().getDay()];
};

const getTodayDateRange = () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  return { startOfToday, endOfToday };
};

const getCurrentTimeString = () => {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};

const buildScheduledTimeForToday = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  return scheduledTime;
};

const isScheduleForToday = (daysOfWeek) => {
  if (!daysOfWeek || daysOfWeek.length === 0) {
    return true;
  }

  if (daysOfWeek.includes("EVERYDAY")) {
    return true;
  }

  return daysOfWeek.includes(getTodayCode());
};

const createDueReminderLogs = async () => {
  try {
    const currentTime = getCurrentTimeString();
    const { startOfToday, endOfToday } = getTodayDateRange();

    const schedules = await prisma.medicineSchedule.findMany({
      where: {
        isActive: true,
        times: {
          has: currentTime,
        },
        startDate: {
          lte: endOfToday,
        },
        OR: [
          {
            endDate: null,
          },
          {
            endDate: {
              gte: startOfToday,
            },
          },
        ],
        medicine: {
          isActive: true,
          startDate: {
            lte: endOfToday,
          },
          OR: [
            {
              endDate: null,
            },
            {
              endDate: {
                gte: startOfToday,
              },
            },
          ],
        },
      },
      include: {
        medicine: true,
      },
    });

    const todaySchedules = schedules.filter((schedule) =>
      isScheduleForToday(schedule.daysOfWeek)
    );

    for (const schedule of todaySchedules) {
      const scheduledTime = buildScheduledTimeForToday(currentTime);

      const existingReminder = await prisma.reminderLog.findUnique({
        where: {
          userId_scheduleId_scheduledTime: {
            userId: schedule.userId,
            scheduleId: schedule.id,
            scheduledTime,
          },
        },
      });

      if (existingReminder) {
        continue;
      }

      const existingIntake = await prisma.intakeLog.findUnique({
        where: {
          userId_scheduleId_scheduledTime: {
            userId: schedule.userId,
            scheduleId: schedule.id,
            scheduledTime,
          },
        },
      });

      if (existingIntake) {
        continue;
      }

      const reminderLog = await prisma.reminderLog.create({
        data: {
          userId: schedule.userId,
          medicineId: schedule.medicineId,
          scheduleId: schedule.id,
          scheduledTime,
          sentTime: new Date(),
          status: "SENT",
        },
      });

      console.log(
        `Reminder created for ${schedule.medicine.name} at ${currentTime}`,
        reminderLog.id
      );
    }
  } catch (error) {
    console.error("Reminder job error:", error);
  }
};

const startReminderJob = () => {
  cron.schedule("* * * * *", async () => {
    await createDueReminderLogs();
  });

  console.log("Reminder job started");
};

module.exports = {
  startReminderJob,
  createDueReminderLogs,
};