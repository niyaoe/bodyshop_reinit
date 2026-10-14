const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Branch = require("../models/Branch");

// Helper: validate branch IDs and return active branch documents
const validateBranches = async (branchIds) => {
  if (!Array.isArray(branchIds) || branchIds.length === 0) {
    return {
      error: "At least one branch is required",
    };
  }

  // Remove duplicate IDs
  const uniqueIds = [...new Set(branchIds.map(String))];

  // Validate ObjectId format
  const mongoose = require("mongoose");

  const invalidId = uniqueIds.some(
    (id) => !mongoose.Types.ObjectId.isValid(id),
  );

  if (invalidId) {
    return {
      error: "Invalid branch ID",
    };
  }

  const branches = await Branch.find({
    _id: { $in: uniqueIds },
  });

  if (branches.length !== uniqueIds.length) {
    return {
      error: "One or more branches were not found",
    };
  }

  const inactiveBranch = branches.find((branch) => !branch.isActive);

  if (inactiveBranch) {
    return {
      error: `Branch "${inactiveBranch.name}" is inactive`,
    };
  }

  return { branches };
};

// Create user
const createUser = async (req, res) => {
  try {
    const { name, email, password, branch, branches, role = "user" } = req.body;

    if (!["user", "manager"].includes(role)) {
      return res.status(400).json({
        message: "Role must be user or manager",
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // Support both the new array and the old single-branch payload
    const branchIds = Array.isArray(branches)
      ? branches
      : branch
        ? [branch]
        : [];

    const validation = await validateBranches(branchIds);

    if (validation.error) {
      return res.status(400).json({
        message: validation.error,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      branches: validation.branches.map((item) => item._id),

      // Keep legacy field synchronized with the first assigned branch
      branch: validation.branches[0]._id,
      isActive: true,
    });

    const createdUser = await User.findById(user._id)
      .select("-password")
      .populate("branch", "name code")
      .populate("branches", "name code");

    return res.status(201).json({
      message: "User created successfully",
      user: createdUser,
    });
  } catch (error) {
    console.error("Create user error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("branch", "name code")
      .populate("branches", "name code")
      .sort({ createdAt: -1 });

    // Return a consistent branches array for older users too
    const normalizedUsers = users.map((user) => {
      const item = user.toObject();

      if (!item.branches || item.branches.length === 0) {
        item.branches = item.branch ? [item.branch] : [];
      }

      return item;
    });

    return res.status(200).json({
      count: normalizedUsers.length,
      users: normalizedUsers,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Get single user
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("branch", "name code")
      .populate("branches", "name code");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const userData = user.toObject();

    if (!userData.branches || userData.branches.length === 0) {
      userData.branches = userData.branch ? [userData.branch] : [];
    }

    return res.status(200).json({
      user: userData,
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, password, branch, branches, isActive, role } =
      req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admin accounts cannot be modified through this API",
      });
    }

    if (role !== undefined) {
      if (!["user", "manager"].includes(role)) {
        return res.status(400).json({
          message: "Role must be user or manager",
        });
      }

      user.role = role;
    }

    // Update branch assignments only when the request includes them
    if (Array.isArray(branches) || branch) {
      const branchIds = Array.isArray(branches) ? branches : [branch];

      const validation = await validateBranches(branchIds);

      if (validation.error) {
        return res.status(400).json({
          message: validation.error,
        });
      }

      user.branches = validation.branches.map((item) => item._id);
      user.branch = validation.branches[0]._id;
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const normalizedEmail = email.toLowerCase().trim();

      const emailExists = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (emailExists) {
        return res.status(409).json({
          message: "Email already in use",
        });
      }

      user.email = normalizedEmail;
    }

    if (name) {
      user.name = name.trim();
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("branch", "name code")
      .populate("branches", "name code");

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Deactivate user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admin accounts cannot be deactivated through this API",
      });
    }

    user.isActive = false;
    await user.save();

    return res.status(200).json({
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
