
const express = require("express");

const {
  getDashboard,
  getOverallStatus,
} = require("../controllers/dashboardController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("admin", "manager", "user"),
  getDashboard
);

router.get(
  "/overall-status",
  protect,
  authorize("admin", "manager", "user"),
  getOverallStatus
);

module.exports = router;
