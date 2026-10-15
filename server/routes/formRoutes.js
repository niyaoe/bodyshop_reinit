const express = require("express");

const {
  createFormRecord,
  getFormRecords,
  updateFormRecord,
  getFormRecordHistory,
} = require("../controllers/formController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Get records
router.get("/", protect, authorize("admin", "manager", "user"), getFormRecords);

// Create record
router.post(
  "/",
  protect,
  authorize("admin", "manager", "user"),
  createFormRecord,
);

// Update record
router.put(
  "/:id",
  protect,
  authorize("admin", "manager", "user"),
  updateFormRecord,
);

// View record history
router.get(
  "/:id/history",
  protect,
  authorize("admin"),
  // authorize("admin", "manager", "user"),
  getFormRecordHistory,
);

module.exports = router;
