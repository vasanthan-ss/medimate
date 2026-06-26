const prisma = require("../config/prisma");

const toNumberOrDefault = (value, defaultValue) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return defaultValue;
  }

  return numberValue;
};

const getMedicineForUser = async (medicineId, userId) => {
  return prisma.medicine.findFirst({
    where: {
      id: medicineId,
      userId,
    },
  });
};

exports.createMedicine = async (req, res) => {
  try {
    const {
      name,
      dosage,
      instructions,
      notes,
      stockCount,
      minimumStock,
      startDate,
      endDate,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Medicine name is required",
      });
    }

    const medicine = await prisma.medicine.create({
      data: {
        name: name.trim(),
        dosage: dosage?.trim() || null,
        instructions: instructions?.trim() || null,
        notes: notes?.trim() || null,
        stockCount: toNumberOrDefault(stockCount, 0),
        minimumStock: toNumberOrDefault(minimumStock, 5),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        userId: req.user.id,
      },
    });

    return res.status(201).json({
      message: "Medicine added successfully",
      medicine,
    });
  } catch (error) {
    console.error("Create medicine error:", error);
    return res.status(500).json({
      message: "Failed to add medicine",
    });
  }
};

exports.getMedicines = async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      medicines,
    });
  } catch (error) {
    console.error("Get medicines error:", error);
    return res.status(500).json({
      message: "Failed to fetch medicines",
    });
  }
};

exports.getMedicineById = async (req, res) => {
  try {
    const medicineId = Number(req.params.id);

    if (Number.isNaN(medicineId)) {
      return res.status(400).json({
        message: "Invalid medicine id",
      });
    }

    const medicine = await getMedicineForUser(medicineId, req.user.id);

    if (!medicine) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    return res.status(200).json({
      medicine,
    });
  } catch (error) {
    console.error("Get medicine by id error:", error);
    return res.status(500).json({
      message: "Failed to fetch medicine",
    });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const medicineId = Number(req.params.id);

    if (Number.isNaN(medicineId)) {
      return res.status(400).json({
        message: "Invalid medicine id",
      });
    }

    const existingMedicine = await getMedicineForUser(medicineId, req.user.id);

    if (!existingMedicine) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    const {
      name,
      dosage,
      instructions,
      notes,
      stockCount,
      minimumStock,
      startDate,
      endDate,
    } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        message: "Medicine name cannot be empty",
      });
    }

    const updatedMedicine = await prisma.medicine.update({
      where: {
        id: medicineId,
      },
      data: {
        name: name !== undefined ? name.trim() : existingMedicine.name,
        dosage:
          dosage !== undefined
            ? dosage.trim() || null
            : existingMedicine.dosage,
        instructions:
          instructions !== undefined
            ? instructions.trim() || null
            : existingMedicine.instructions,
        notes:
          notes !== undefined
            ? notes.trim() || null
            : existingMedicine.notes,
        stockCount:
          stockCount !== undefined
            ? toNumberOrDefault(stockCount, existingMedicine.stockCount)
            : existingMedicine.stockCount,
        minimumStock:
          minimumStock !== undefined
            ? toNumberOrDefault(minimumStock, existingMedicine.minimumStock)
            : existingMedicine.minimumStock,
        startDate:
          startDate !== undefined
            ? new Date(startDate)
            : existingMedicine.startDate,
        endDate:
          endDate !== undefined && endDate !== ""
            ? new Date(endDate)
            : null,
      },
    });

    return res.status(200).json({
      message: "Medicine updated successfully",
      medicine: updatedMedicine,
    });
  } catch (error) {
    console.error("Update medicine error:", error);
    return res.status(500).json({
      message: "Failed to update medicine",
    });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const medicineId = Number(req.params.id);

    if (Number.isNaN(medicineId)) {
      return res.status(400).json({
        message: "Invalid medicine id",
      });
    }

    const existingMedicine = await getMedicineForUser(medicineId, req.user.id);

    if (!existingMedicine) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    await prisma.medicine.delete({
      where: {
        id: medicineId,
      },
    });

    return res.status(200).json({
      message: "Medicine deleted successfully",
    });
  } catch (error) {
    console.error("Delete medicine error:", error);
    return res.status(500).json({
      message: "Failed to delete medicine",
    });
  }
};

exports.pauseMedicine = async (req, res) => {
  try {
    const medicineId = Number(req.params.id);

    if (Number.isNaN(medicineId)) {
      return res.status(400).json({
        message: "Invalid medicine id",
      });
    }

    const existingMedicine = await getMedicineForUser(medicineId, req.user.id);

    if (!existingMedicine) {
      return res.status(404).json({
        message: "Medicine not found",
      });
    }

    const updatedMedicine = await prisma.medicine.update({
      where: {
        id: medicineId,
      },
      data: {
        isActive: !existingMedicine.isActive,
      },
    });

    return res.status(200).json({
      message: updatedMedicine.isActive
        ? "Medicine resumed successfully"
        : "Medicine paused successfully",
      medicine: updatedMedicine,
    });
  } catch (error) {
    console.error("Pause medicine error:", error);
    return res.status(500).json({
      message: "Failed to update medicine status",
    });
  }
};