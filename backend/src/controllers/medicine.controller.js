const prisma = require("../config/prisma");

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
      return res.status(400).json({ message: "Medicine name is required" });
    }

    const medicine = await prisma.medicine.create({
      data: {
        name: name.trim(),
        dosage: dosage?.trim() || null,
        instructions: instructions?.trim() || null,
        notes: notes?.trim() || null,
        stockCount: Number(stockCount) || 0,
        minimumStock: Number(minimumStock) || 5,
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
    return res.status(500).json({ message: "Failed to add medicine" });
  }
};

exports.getMedicines = async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ medicines });
  } catch (error) {
    console.error("Get medicines error:", error);
    return res.status(500).json({ message: "Failed to fetch medicines" });
  }
};

exports.getMedicineById = async (req, res) => {
  try {
    const medicine = await prisma.medicine.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
      },
    });

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    return res.json({ medicine });
  } catch (error) {
    console.error("Get medicine error:", error);
    return res.status(500).json({ message: "Failed to fetch medicine" });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const medicineId = Number(req.params.id);

    const existingMedicine = await prisma.medicine.findFirst({
      where: {
        id: medicineId,
        userId: req.user.id,
      },
    });

    if (!existingMedicine) {
      return res.status(404).json({ message: "Medicine not found" });
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

    const updatedMedicine = await prisma.medicine.update({
      where: { id: medicineId },
      data: {
        name: name?.trim() || existingMedicine.name,
        dosage: dosage?.trim() || null,
        instructions: instructions?.trim() || null,
        notes: notes?.trim() || null,
        stockCount:
          stockCount !== undefined ? Number(stockCount) : existingMedicine.stockCount,
        minimumStock:
          minimumStock !== undefined
            ? Number(minimumStock)
            : existingMedicine.minimumStock,
        startDate: startDate ? new Date(startDate) : existingMedicine.startDate,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return res.json({
      message: "Medicine updated successfully",
      medicine: updatedMedicine,
    });
  } catch (error) {
    console.error("Update medicine error:", error);
    return res.status(500).json({ message: "Failed to update medicine" });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const medicineId = Number(req.params.id);

    const existingMedicine = await prisma.medicine.findFirst({
      where: {
        id: medicineId,
        userId: req.user.id,
      },
    });

    if (!existingMedicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    await prisma.medicine.delete({
      where: { id: medicineId },
    });

    return res.json({ message: "Medicine deleted successfully" });
  } catch (error) {
    console.error("Delete medicine error:", error);
    return res.status(500).json({ message: "Failed to delete medicine" });
  }
};

exports.pauseMedicine = async (req, res) => {
  try {
    const medicineId = Number(req.params.id);

    const existingMedicine = await prisma.medicine.findFirst({
      where: {
        id: medicineId,
        userId: req.user.id,
      },
    });

    if (!existingMedicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    const updatedMedicine = await prisma.medicine.update({
      where: { id: medicineId },
      data: {
        isActive: !existingMedicine.isActive,
      },
    });

    return res.json({
      message: updatedMedicine.isActive
        ? "Medicine resumed successfully"
        : "Medicine paused successfully",
      medicine: updatedMedicine,
    });
  } catch (error) {
    console.error("Pause medicine error:", error);
    return res.status(500).json({ message: "Failed to update medicine status" });
  }
};