const express = require("express");

const {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} = require("../controllers/branchController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// Admin only
router.post("/", protect, authorize("admin"), createBranch);

router.get("/", protect, authorize("admin" ,"user"), getBranches);

router.get("/:id", protect, authorize("admin"), getBranchById);

router.put("/:id", protect, authorize("admin"), updateBranch);

router.delete("/:id", protect, authorize("admin"), deleteBranch);

module.exports = router;