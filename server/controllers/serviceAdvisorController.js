
const mongoose = require("mongoose");
const ServiceAdvisor = require("../models/ServiceAdvisor");
const Branch = require("../models/Branch");

// Get service advisers
const getServiceAdvisors = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";

    // Users can only access advisers from their own branch.
    const userBranchId =
      req.user.branch?._id || req.user.branch;

    if (!isAdmin && !userBranchId) {
      return res.status(403).json({
        message: "No branch assigned to this user",
      });
    }

    const filter = isAdmin
      ? req.query.includeInactive === "true"
        ? {}
        : { isActive: true }
      : {
          branch: userBranchId,
          isActive: true,
        };

    // Optional branch filter for admin
    if (isAdmin && req.query.branchId) {
      if (!mongoose.isValidObjectId(req.query.branchId)) {
        return res.status(400).json({
          message: "Invalid branch ID",
        });
      }

      filter.branch = req.query.branchId;
    }

    const serviceAdvisors = await ServiceAdvisor.find(filter)
      .populate("branch", "name code")
      .sort({ name: 1 });

    return res.status(200).json({
      message: "Service advisers fetched successfully",
      serviceAdvisors,
    });
  } catch (error) {
    console.error("Get service advisers error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Create service adviser (admin only)
const createServiceAdvisor = async (req, res) => {
  try {
    const { name, branchId } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Service adviser name is required",
      });
    }

    if (!branchId || !mongoose.isValidObjectId(branchId)) {
      return res.status(400).json({
        message: "A valid branch is required",
      });
    }

    const branch = await Branch.findById(branchId);

    if (!branch) {
      return res.status(404).json({
        message: "Branch not found",
      });
    }

    const trimmedName = name.trim();

    const existing = await ServiceAdvisor.findOne({
      name: {
        $regex: `^${trimmedName.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}$`,
        $options: "i",
      },
    });

    if (existing) {
      return res.status(409).json({
        message: "Service adviser already exists",
      });
    }

    const serviceAdvisor = await ServiceAdvisor.create({
      name: trimmedName,
      branch: branchId,
    });

    const populatedAdvisor = await ServiceAdvisor.findById(
      serviceAdvisor._id
    ).populate("branch", "name code");

    return res.status(201).json({
      message: "Service adviser created successfully",
      serviceAdvisor: populatedAdvisor,
    });
  } catch (error) {
    console.error("Create service adviser error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Service adviser name already exists",
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Update service adviser (admin only)
const updateServiceAdvisor = async (req, res) => {
  try {
    const { name, isActive, branchId } = req.body;
    const updates = {};

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid service adviser ID",
      });
    }

    if (typeof name === "string" && name.trim()) {
      const trimmedName = name.trim();

      const existing = await ServiceAdvisor.findOne({
        _id: { $ne: req.params.id },
        name: {
          $regex: `^${trimmedName.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}$`,
          $options: "i",
        },
      });

      if (existing) {
        return res.status(409).json({
          message: "Service adviser name already exists",
        });
      }

      updates.name = trimmedName;
    }

    if (typeof isActive === "boolean") {
      updates.isActive = isActive;
    }

    if (branchId !== undefined) {
      if (!mongoose.isValidObjectId(branchId)) {
        return res.status(400).json({
          message: "Invalid branch ID",
        });
      }

      const branch = await Branch.findById(branchId);

      if (!branch) {
        return res.status(404).json({
          message: "Branch not found",
        });
      }

      updates.branch = branchId;
    }

    const serviceAdvisor = await ServiceAdvisor.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("branch", "name code");

    if (!serviceAdvisor) {
      return res.status(404).json({
        message: "Service adviser not found",
      });
    }

    return res.status(200).json({
      message: "Service adviser updated successfully",
      serviceAdvisor,
    });
  } catch (error) {
    console.error("Update service adviser error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Service adviser name already exists",
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getServiceAdvisors,
  createServiceAdvisor,
  updateServiceAdvisor,
};
