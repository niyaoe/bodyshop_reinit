
const InsuranceCompany = require("../models/InsuranceCompany");

// Create insurance company
const createInsuranceCompany = async (req, res) => {
  try {
    const { name, sortOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Insurance company name is required",
      });
    }

    const existing = await InsuranceCompany.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });

    if (existing) {
      return res.status(409).json({
        message: "Insurance company already exists",
      });
    }

    const insuranceCompany = await InsuranceCompany.create({
      name: name.trim(),
      sortOrder: sortOrder ?? 0,
      isActive: true,
    });

    return res.status(201).json({
      message: "Insurance company created successfully",
      insuranceCompany,
    });
  } catch (error) {
    console.error("Create insurance company error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get active insurance companies
const getInsuranceCompanies = async (req, res) => {
  try {
    const insuranceCompanies = await InsuranceCompany.find({
      isActive: true,
    }).sort({ sortOrder: 1, name: 1 });

    return res.status(200).json({
      count: insuranceCompanies.length,
      insuranceCompanies,
    });
  } catch (error) {
    console.error("Get insurance companies error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update insurance company
const updateInsuranceCompany = async (req, res) => {
  try {
    const { name, sortOrder, isActive } = req.body;

    const insuranceCompany = await InsuranceCompany.findById(req.params.id);

    if (!insuranceCompany) {
      return res.status(404).json({
        message: "Insurance company not found",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "Insurance company name is required",
        });
      }

      const duplicate = await InsuranceCompany.findOne({
        name: { $regex: `^${name.trim()}$`, $options: "i" },
        _id: { $ne: insuranceCompany._id },
      });

      if (duplicate) {
        return res.status(409).json({
          message: "Insurance company name already exists",
        });
      }

      insuranceCompany.name = name.trim();
    }

    if (sortOrder !== undefined) {
      const order = Number(sortOrder);

      if (!Number.isFinite(order)) {
        return res.status(400).json({
          message: "Sort order must be a valid number",
        });
      }

      insuranceCompany.sortOrder = order;
    }

    if (typeof isActive === "boolean") {
      insuranceCompany.isActive = isActive;
    }

    await insuranceCompany.save();

    return res.status(200).json({
      message: "Insurance company updated successfully",
      insuranceCompany,
    });
  } catch (error) {
    console.error("Update insurance company error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Deactivate insurance company
const deleteInsuranceCompany = async (req, res) => {
  try {
    const insuranceCompany = await InsuranceCompany.findById(req.params.id);

    if (!insuranceCompany) {
      return res.status(404).json({
        message: "Insurance company not found",
      });
    }

    insuranceCompany.isActive = false;
    await insuranceCompany.save();

    return res.status(200).json({
      message: "Insurance company deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate insurance company error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createInsuranceCompany,
  getInsuranceCompanies,
  updateInsuranceCompany,
  deleteInsuranceCompany,
};
