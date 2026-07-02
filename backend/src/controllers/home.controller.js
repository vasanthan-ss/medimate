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

const isScheduleForToday = (daysOfWeek) => {
  if (!daysOfWeek || daysOfWeek.length === 0) {
    return true;
  }

  if (daysOfWeek.includes("EVERYDAY")) {
    return true;
  }

  return daysOfWeek.includes(getTodayCode());
};

const minutesFromTime = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const getCurrentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

const buildTodayMedicineItems = (schedules) => {
  const items = [];

  schedules.forEach((schedule) => {
    if (!isScheduleForToday(schedule.daysOfWeek)) {
      return;
    }

    schedule.times.forEach((time) => {
      items.push({
        scheduleId: schedule.id,
        medicineId: schedule.medicine.id,
        name: schedule.medicine.name,
        dosage: schedule.medicine.dosage,
        instructions: schedule.medicine.instructions,
        stockCount: schedule.medicine.stockCount,
        minimumStock: schedule.medicine.minimumStock,
        isLowStock:
          schedule.medicine.stockCount <= schedule.medicine.minimumStock,
        time,
        daysOfWeek: schedule.daysOfWeek,
      });
    });
  });

  return items.sort((a, b) => minutesFromTime(a.time) - minutesFromTime(b.time));
};

exports.getTodayMedicines = async (req, res) => {
  try {
    const { startOfToday, endOfToday } = getTodayDateRange();

    const schedules = await prisma.medicineSchedule.findMany({
      where: {
        userId: req.user.id,
        isActive: true,
        medicine: {
          userId: req.user.id,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    const medicines = buildTodayMedicineItems(schedules);

    return res.status(200).json({
      medicines,
    });
  } catch (error) {
    console.error("Get today medicines error:", error);
    return res.status(500).json({
      message: "Failed to fetch today's medicines",
    });
  }
};

exports.getHomeSummary = async (req, res) => {
  try {
    const { startOfToday, endOfToday } = getTodayDateRange();

    const schedules = await prisma.medicineSchedule.findMany({
      where: {
        userId: req.user.id,
        isActive: true,
        medicine: {
          userId: req.user.id,
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

    const medicines = buildTodayMedicineItems(schedules);

    const currentMinutes = getCurrentMinutes();

    const upcomingMedicines = medicines.filter(
      (item) => minutesFromTime(item.time) >= currentMinutes
    );

    const nextReminder =
      upcomingMedicines.length > 0 ? upcomingMedicines[0] : null;

    const lowStockMedicines = medicines.filter((item) => item.isLowStock);

    return res.status(200).json({
      totalToday: medicines.length,
      nextReminder,
      lowStockCount: lowStockMedicines.length,
      lowStockMedicines,
    });
  } catch (error) {
    console.error("Get home summary error:", error);
    return res.status(500).json({
      message: "Failed to fetch home summary",
    });
  }
};