const Status = require("../models/Status");

// Create status
const createStatus = async (req, res) => {
  try {
    const { name, section, sortOrder } = req.body;

    if (!name || !section) {
      return res.status(400).json({
        message: "Status name and section are required",
      });
    }

    const allowedSections = [
      "legalLoss",
      "billed",
      "open",
    ];

    if (!allowedSections.includes(section)) {
      return res.status(400).json({
        message: "Invalid status section",
      });
    }

    const existingStatus = await Status.findOne({
      name: name.trim(),
    });

    if (existingStatus) {
      return res.status(409).json({
        message: "Status already exists",
      });
    }

    const status = await Status.create({
      name: name.trim(),
      section,
      sortOrder: sortOrder || 0,
      isActive: true,
    });

    res.status(201).json({
      message: "Status created successfully",
      status,
    });
  } catch (error) {
    console.error("Create status error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get statuses
const getStatuses = async (req, res) => {
  try {
    const { section } = req.query;

    const filter = {
      isActive: true,
    };

    if (section) {
      const allowedSections = [
        "legalLoss",
        "billed",
        "open",
      ];

      if (!allowedSections.includes(section)) {
        return res.status(400).json({
          message: "Invalid status section",
        });
      }

      filter.section = section;
    }

    const statuses = await Status.find(filter).sort({
      sortOrder: 1,
      name: 1,
    });

    res.status(200).json({
      count: statuses.length,
      statuses,
    });
  } catch (error) {
    console.error("Get statuses error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Update status
const updateStatus = async (req, res) => {
  try {
    const { name, section, sortOrder, isActive } = req.body;

    const status = await Status.findById(req.params.id);

    if (!status) {
      return res.status(404).json({
        message: "Status not found",
      });
    }

    if (name) {
      const duplicate = await Status.findOne({
        name: name.trim(),
        _id: { $ne: status._id },
      });

      if (duplicate) {
        return res.status(409).json({
          message: "Status name already exists",
        });
      }

      status.name = name.trim();
    }

    if (section) {
      const allowedSections = [
        "legalLoss",
        "billed",
        "open",
      ];

      if (!allowedSections.includes(section)) {
        return res.status(400).json({
          message: "Invalid status section",
        });
      }

      status.section = section;
    }

    if (sortOrder !== undefined) {
      status.sortOrder = sortOrder;
    }

    if (typeof isActive === "boolean") {
      status.isActive = isActive;
    }

    await status.save();

    res.status(200).json({
      message: "Status updated successfully",
      status,
    });
  } catch (error) {
    console.error("Update status error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Deactivate status
const deleteStatus = async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);

    if (!status) {
      return res.status(404).json({
        message: "Status not found",
      });
    }

    status.isActive = false;

    await status.save();

    res.status(200).json({
      message: "Status deactivated successfully",
    });
  } catch (error) {
    console.error("Delete status error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createStatus,
  getStatuses,
  updateStatus,
  deleteStatus,
};