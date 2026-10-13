
const express = require("express");
const router = express.Router();

const {
  createInsuranceCompany,
  getInsuranceCompanies,
  updateInsuranceCompany,
  deleteInsuranceCompany,
} = require("../controllers/insuranceCompanyController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.get("/", protect, authorize("admin", "user"), getInsuranceCompanies);
router.post("/", protect, authorize("admin"), createInsuranceCompany);
router.put("/:id", protect, authorize("admin"), updateInsuranceCompany);
router.delete("/:id", protect, authorize("admin"), deleteInsuranceCompany);

module.exports = router;
