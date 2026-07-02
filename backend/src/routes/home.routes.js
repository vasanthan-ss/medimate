const express = require("express");
const { protect } = require("../middleware/auth.middleware");

const {
  getTodayMedicines,
  getHomeSummary,
} = require("../controllers/home.controller");

const router = express.Router();

router.use(protect);

router.get("/today", getTodayMedicines);
router.get("/summary", getHomeSummary);

module.exports = router;