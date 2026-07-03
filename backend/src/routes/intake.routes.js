const express = require("express");
const { protect } = require("../middleware/auth.middleware");

const {
  markTaken,
  markSkipped,
  getTodayIntakeLogs,
} = require("../controllers/intake.controller");

const router = express.Router();

router.use(protect);

router.post("/taken", markTaken);
router.post("/skipped", markSkipped);
router.get("/today", getTodayIntakeLogs);

module.exports = router;