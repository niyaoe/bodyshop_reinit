
const express = require("express");
const router = express.Router();

const {
  createVehicleModel,
  getVehicleModels,
  updateVehicleModel,
  deleteVehicleModel,
} = require("../controllers/vehicleModelController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// Get active models: admin and user
router.get("/", protect, authorize("admin", "user"), getVehicleModels);

// Create model: admin only
router.post("/", protect, authorize("admin"), createVehicleModel);

// Update model: admin only
router.put("/:id", protect, authorize("admin"), updateVehicleModel);

// Deactivate model: admin only
router.delete("/:id", protect, authorize("admin"), deleteVehicleModel);

module.exports = router;
