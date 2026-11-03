const express = require("express");

const {
  createFormRecord,
  getFormRecords,
  updateFormRecord,
  getFormRecordHistory,
  deleteFormRecord,
  getInspectionForm,
  saveInspectionForm,
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

router.delete("/:id", protect, authorize("admin"), deleteFormRecord);

// Get Q1/Q2/Q3 inspection form
router.get(
  "/:id/inspections/:type",
  protect,
  authorize("admin", "manager", "user"),
  getInspectionForm,
);

// Save or update Q1/Q2/Q3 inspection form
router.put(
  "/:id/inspections/:type",
  protect,
  authorize("admin", "manager", "user"),
  saveInspectionForm,
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
