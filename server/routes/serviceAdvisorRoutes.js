const express = require("express");
const router = express.Router();

const {
  getServiceAdvisors,
  createServiceAdvisor,
  updateServiceAdvisor,
} = require("../controllers/serviceAdvisorController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.get("/", protect, getServiceAdvisors);

router.post("/", protect, authorize("admin"), createServiceAdvisor);

router.patch("/:id", protect, authorize("admin"), updateServiceAdvisor);

module.exports = router;
