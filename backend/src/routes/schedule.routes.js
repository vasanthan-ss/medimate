const express = require("express");
const { protect } = require("../middleware/auth.middleware");

const {
  createSchedule,
  getSchedules,
  updateSchedule,
} = require("../controllers/schedule.controller");

const router = express.Router();

router.use(protect);

router.post("/", createSchedule);
router.get("/", getSchedules);
router.put("/:id", updateSchedule);

module.exports = router;