const express = require("express");

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Admin only
router.post("/", protect, authorize("admin"), createUser);

router.get("/", protect, authorize("admin"), getUsers);

router.get("/:id", protect, authorize("admin"), getUserById);

router.put("/:id", protect, authorize("admin"), updateUser);

router.delete("/:id", protect, authorize("admin"), deleteUser);

module.exports = router;