const prisma = require("../config/prisma");

const DAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const isValidTime = (time) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
};

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

const markIntake = async (req, res, status) => {
  try {
    const { scheduleId, medicineId, time } = req.body;

    const cleanScheduleId = Number(scheduleId);
    const cleanMedicineId = Number(medicineId);

    if (Number.isNaN(cleanScheduleId) || Number.isNaN(cleanMedicineId)) {
      return res.status(400).json({
        message: "Valid schedule and medicine are required",
      });
    }

    if (!time || !isValidTime(time)) {
      return res.status(400).json({
        message: "Valid scheduled time is required",
      });
    }

    const schedule = await prisma.medicineSchedule.findFirst({
      where: {
        id: cleanScheduleId,
        userId: req.user.id,
        medicineId: cleanMedicineId,
        isActive: true,
      },
      include: {
        medicine: true,
      },
    });

    if (!schedule) {
      return res.status(404).json({
        message: "Schedule not found",
      });
    }

    if (!schedule.medicine.isActive) {
      return res.status(400).json({
        message: "Medicine is paused",
      });
    }

    if (!schedule.times.includes(time)) {
      return res.status(400).json({
        message: "This time is not part of the schedule",
      });
    }

    if (!isScheduleForToday(schedule.daysOfWeek)) {
      return res.status(400).json({
        message: "This medicine is not scheduled for today",
      });
    }

    const scheduledTime = buildScheduledTimeForToday(time);

    const existingLog = await prisma.intakeLog.findUnique({
      where: {
        userId_scheduleId_scheduledTime: {
          userId: req.user.id,
          scheduleId: cleanScheduleId,
          scheduledTime,
        },
      },
    });

    if (existingLog) {
      return res.status(409).json({
        message: "This dose is already marked",
        intakeLog: existingLog,
      });
    }

    const intakeLog = await prisma.intakeLog.create({
      data: {
        userId: req.user.id,
        medicineId: cleanMedicineId,
        scheduleId: cleanScheduleId,
        scheduledTime,
        takenTime: status === "TAKEN" ? new Date() : null,
        status,
      },
    });

    return res.status(201).json({
      message:
        status === "TAKEN"
          ? "Medicine marked as taken"
          : "Medicine marked as skipped",
      intakeLog,
    });
  } catch (error) {
    console.error("Mark intake error:", error);
    return res.status(500).json({
      message: "Failed to mark intake",
    });
  }
};

exports.markTaken = async (req, res) => {
  return markIntake(req, res, "TAKEN");
};

exports.markSkipped = async (req, res) => {
  return markIntake(req, res, "SKIPPED");
};

exports.getTodayIntakeLogs = async (req, res) => {
  try {
    const { startOfToday, endOfToday } = getTodayDateRange();

    const intakeLogs = await prisma.intakeLog.findMany({
      where: {
        userId: req.user.id,
        scheduledTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            dosage: true,
          },
        },
      },
      orderBy: {
        scheduledTime: "asc",
      },
    });

    return res.status(200).json({
      intakeLogs,
    });
  } catch (error) {
    console.error("Get today intake logs error:", error);
    return res.status(500).json({
      message: "Failed to fetch today's intake logs",
    });
  }
};