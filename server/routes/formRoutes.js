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

//get records
router.get("/", protect, authorize("admin", "user"), getFormRecords);

// Admin + User
router.post("/", protect, authorize("admin", "user"), createFormRecord);

// Update record
router.put("/:id", protect, authorize("admin", "user"), updateFormRecord);

router.get(
  "/:id/history",
  protect,
  authorize("admin"),
  getFormRecordHistory,
);

module.exports = router;
