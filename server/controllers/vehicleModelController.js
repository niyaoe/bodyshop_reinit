
const mongoose = require("mongoose");
const VehicleModel = require("../models/VehicleModel");

// Create vehicle model
const createVehicleModel = async (req, res) => {
  try {
    const {
      name,
      subSegmentName = "",
      sortOrder = 0,
    } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Model name is required",
      });
    }

    if (typeof subSegmentName !== "string") {
      return res.status(400).json({
        message: "Sub segment name must be a string",
      });
    }

    const existingModel = await VehicleModel.findOne({
      name: {
        $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (existingModel) {
      return res.status(409).json({
        message: "This vehicle model already exists",
      });
    }

    const vehicleModel = await VehicleModel.create({
      name: name.trim(),
      subSegmentName: subSegmentName.trim(),
      sortOrder,
    });

    return res.status(201).json({
      message: "Vehicle model created successfully",
      vehicleModel,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create vehicle model",
      error: error.message,
    });
  }
};

// Get active vehicle models
const getVehicleModels = async (req, res) => {
  try {
    const vehicleModels = await VehicleModel.find({
      isActive: true,
    }).sort({
      sortOrder: 1,
      name: 1,
    });

    return res.status(200).json({
      count: vehicleModels.length,
      vehicleModels,
    });
  } catch (error) {
    console.error("Get vehicle models error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Update vehicle model
const updateVehicleModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subSegmentName, sortOrder } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid vehicle model ID",
      });
    }

    const vehicleModel = await VehicleModel.findById(id);

    if (!vehicleModel) {
      return res.status(404).json({
        message: "Vehicle model not found",
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Model name is required",
        });
      }

      const duplicate = await VehicleModel.findOne({
        _id: { $ne: id },
        name: {
          $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
      });

      if (duplicate) {
        return res.status(409).json({
          message: "This vehicle model already exists",
        });
      }

      vehicleModel.name = name.trim();
    }

    if (subSegmentName !== undefined) {
      if (typeof subSegmentName !== "string") {
        return res.status(400).json({
          message: "Sub segment name must be a string",
        });
      }

      vehicleModel.subSegmentName = subSegmentName.trim();
    }

    if (sortOrder !== undefined) {
      vehicleModel.sortOrder = sortOrder;
    }

    await vehicleModel.save();

    return res.status(200).json({
      message: "Vehicle model updated successfully",
      vehicleModel,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update vehicle model",
      error: error.message,
    });
  }
};

// Deactivate vehicle model
const deleteVehicleModel = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid vehicle model ID",
      });
    }

    const vehicleModel = await VehicleModel.findById(
      req.params.id
    );

    if (!vehicleModel) {
      return res.status(404).json({
        message: "Vehicle model not found",
      });
    }

    vehicleModel.isActive = false;

    await vehicleModel.save();

    return res.status(200).json({
      message: "Vehicle model deactivated successfully",
    });
  } catch (error) {
    console.error("Delete vehicle model error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createVehicleModel,
  getVehicleModels,
  updateVehicleModel,
  deleteVehicleModel,
};
