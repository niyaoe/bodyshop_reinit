const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Branch = require("../models/Branch");

// Create user
const createUser = async (req, res) => {
  try {
    const { name, email, password, branch } = req.body;

    if (!name || !email || !password || !branch) {
      return res.status(400).json({
        message: "Name, email, password and branch are required",
      });
    }

    // Check branch
    const existingBranch = await Branch.findById(branch);

    if (!existingBranch) {
      return res.status(404).json({
        message: "Branch not found",
      });
    }

    if (!existingBranch.isActive) {
      return res.status(400).json({
        message: "Selected branch is inactive",
      });
    }

    // Check existing email
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user",
      branch,
      isActive: true,
    });

    const createdUser = await User.findById(user._id)
      .select("-password")
      .populate("branch", "name code");

    res.status(201).json({
      message: "User created successfully",
      user: createdUser,
    });
  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
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
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get single user
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("branch", "name code");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, password, branch, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check branch if provided
    if (branch) {
      const existingBranch = await Branch.findById(branch);

      if (!existingBranch) {
        return res.status(404).json({
          message: "Branch not found",
        });
      }

      if (!existingBranch.isActive) {
        return res.status(400).json({
          message: "Selected branch is inactive",
        });
      }

      user.branch = branch;
    }

    // Check email if changed
    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id },
      });

      if (emailExists) {
        return res.status(409).json({
          message: "Email already in use",
        });
      }

      user.email = email.toLowerCase();
    }

    if (name) {
      user.name = name;
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
      .populate("branch", "name code");

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
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

    // Don't permanently delete the user.
    // Deactivate instead.
    user.isActive = false;

    await user.save();

    res.status(200).json({
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
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