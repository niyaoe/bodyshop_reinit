const Branch = require("../models/Branch");

// Create branch
const createBranch = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        message: "Branch name and code are required",
      });
    }

    const existingBranch = await Branch.findOne({
      $or: [
        { name: name.trim() },
        { code: code.trim().toUpperCase() },
      ],
    });

    if (existingBranch) {
      return res.status(409).json({
        message: "Branch name or code already exists",
      });
    }

    const branch = await Branch.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    res.status(201).json({
      message: "Branch created successfully",
      branch,
    });
  } catch (error) {
    console.error("Create branch error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get all branches
// Get active branches
const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({
      isActive: { $ne: false },
    }).sort({ name: 1 });

    res.status(200).json({
      count: branches.length,
      branches,
    });
  } catch (error) {
    console.error("Get branches error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get single branch
const getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({
        message: "Branch not found",
      });
    }

    res.status(200).json({
      branch,
    });
  } catch (error) {
    console.error("Get branch error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Update branch
const updateBranch = async (req, res) => {
  try {
    const { name, code, isActive } = req.body;

    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({
        message: "Branch not found",
      });
    }

    if (name) {
      branch.name = name.trim();
    }

    if (code) {
      branch.code = code.trim().toUpperCase();
    }

    if (typeof isActive === "boolean") {
      branch.isActive = isActive;
    }

    await branch.save();

    res.status(200).json({
      message: "Branch updated successfully",
      branch,
    });
  } catch (error) {
    console.error("Update branch error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Deactivate branch
// Deactivate branch
const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({
        message: "Branch not found",
      });
    }

    if (!branch.isActive) {
      return res.status(400).json({
        message: "Branch is already deactivated",
      });
    }

    branch.isActive = false;
    await branch.save();

    return res.status(200).json({
      message: "Branch deactivated successfully",
      branchId: branch._id,
    });
  } catch (error) {
    console.error("Delete branch error:", error);

    return res.status(500).json({
      message: error.message || "Server error",
    });
  }
};

module.exports = {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};