const prisma = require("../config/prisma");

const VALID_DAYS = [
  "EVERYDAY",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

const isValidTime = (time) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
};

const cleanTimes = (times) => {
  if (!Array.isArray(times)) return [];

  return times
    .map((time) => String(time).trim())
    .filter((time) => time && isValidTime(time));
};

const cleanDays = (daysOfWeek) => {
  if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
    return ["EVERYDAY"];
  }

  const cleaned = daysOfWeek
    .map((day) => String(day).trim().toUpperCase())
    .filter((day) => VALID_DAYS.includes(day));

  if (cleaned.includes("EVERYDAY")) {
    return ["EVERYDAY"];
  }

  return cleaned.length > 0 ? cleaned : ["EVERYDAY"];
};

const getUserMedicine = async (medicineId, userId) => {
  return prisma.medicine.findFirst({
    where: {
      id: medicineId,
      userId,
    },
  });
};

exports.createSchedule = async (req, res) => {
  try {
    const { medicineId, times, daysOfWeek, startDate, endDate } = req.body;

    const cleanMedicineId = Number(medicineId);

    if (Number.isNaN(cleanMedicineId)) {
      return res.status(400).json({
        message: "Valid medicine id is required",
      });
    }

    const medicine = await getUserMedicine(cleanMedicineId, req.user.id);

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    const validTimes = cleanTimes(times);

    if (validTimes.length === 0) {
      return res.status(400).json({
        message: "At least one valid time is required",
      });
    }

    const schedule = await prisma.medicineSchedule.create({
      data: {
        medicineId: cleanMedicineId,
        userId: req.user.id,
        times: validTimes,
        daysOfWeek: cleanDays(daysOfWeek),
        startDate: startDate ? new Date(startDate) : medicine.startDate,
        endDate: endDate ? new Date(endDate) : medicine.endDate,
      },
    });

    return res.status(201).json({
      message: "Schedule created successfully",
      schedule,
    });
  } catch (error) {
    console.error("Create schedule error:", error);
    return res.status(500).json({
      message: "Failed to create schedule",
    });
  }
};

exports.getSchedules = async (req, res) => {
  try {
    const schedules = await prisma.medicineSchedule.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            dosage: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      schedules,
    });
  } catch (error) {
    console.error("Get schedules error:", error);
    return res.status(500).json({
      message: "Failed to fetch schedules",
    });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const scheduleId = Number(req.params.id);

    if (Number.isNaN(scheduleId)) {
      return res.status(400).json({
        message: "Invalid schedule id",
      });
    }

    const existingSchedule = await prisma.medicineSchedule.findFirst({
      where: {
        id: scheduleId,
        userId: req.user.id,
      },
    });

    if (!existingSchedule) {
      return res.status(404).json({
        message: "Schedule not found",
      });
    }

    const { times, daysOfWeek, startDate, endDate, isActive } = req.body;

    const validTimes = times !== undefined ? cleanTimes(times) : existingSchedule.times;

    if (validTimes.length === 0) {
      return res.status(400).json({
        message: "At least one valid time is required",
      });
    }

    const updatedSchedule = await prisma.medicineSchedule.update({
      where: {
        id: scheduleId,
      },
      data: {
        times: validTimes,
        daysOfWeek:
          daysOfWeek !== undefined
            ? cleanDays(daysOfWeek)
            : existingSchedule.daysOfWeek,
        startDate:
          startDate !== undefined
            ? new Date(startDate)
            : existingSchedule.startDate,
        endDate:
          endDate !== undefined && endDate !== ""
            ? new Date(endDate)
            : null,
        isActive:
          isActive !== undefined ? Boolean(isActive) : existingSchedule.isActive,
      },
    });

    return res.status(200).json({
      message: "Schedule updated successfully",
      schedule: updatedSchedule,
    });
  } catch (error) {
    console.error("Update schedule error:", error);
    return res.status(500).json({
      message: "Failed to update schedule",
    });
  }
};