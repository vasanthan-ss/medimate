const express = require("express");
const { protect } = require("../middleware/auth.middleware");

const {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  pauseMedicine,
} = require("../controllers/medicine.controller");

const router = express.Router();

router.use(protect);

router.post("/", createMedicine);
router.get("/", getMedicines);
router.get("/:id", getMedicineById);
router.put("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);
router.patch("/:id/pause", pauseMedicine);

module.exports = router;