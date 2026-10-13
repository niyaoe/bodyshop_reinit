const express = require("express");

const {
  createStatus,
  getStatuses,
  updateStatus,
  deleteStatus,
} = require("../controllers/statusController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Get active statuses
router.get(
  "/",
  protect,
  authorize("admin", "user"),
  getStatuses
);

// Admin only
router.post(
  "/",
  protect,
  authorize("admin"),
  createStatus
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateStatus
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteStatus
);

module.exports = router;