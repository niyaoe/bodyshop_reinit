const FormRecord = require("../models/FormRecord");
const Branch = require("../models/Branch");
const Status = require("../models/Status");
const mongoose = require("mongoose");
const RecordHistory = require("../models/RecordHistory");

// Get all assigned branch IDs, including legacy single-branch users
const getAssignedBranchIds = (user) => {
  const assignedBranches = [
    ...(user.branches || []),
    ...(user.branch ? [user.branch] : []),
  ];

  return [
    ...new Set(
      assignedBranches
        .map((branch) => String(branch?._id || branch))
        .filter(Boolean),
    ),
  ];
};

// Create form record
const createFormRecord = async (req, res) => {
  try {
    const {
      branch,
      yardEntryDate,
      roDate,
      roNumber,
      regNo,
      model,
      customerName,
      contactNo,
      serviceAdvisor,
      whatsappGroupCreationDate,
      nextPmsDate,
      shieldEligibility,
      rsaEligibility,
      insuranceStatus,
      insuranceName,
      labourEstimate,
      partsEstimate,
      jobType,
      promisedDeliveryDate,
      presentStatus,
      labourBillAmount,
      partsBillAmount,
      billDate,
    } = req.body;

    // ----------------------------------
    // Basic validation
    // ----------------------------------

    // if (
    //   !yardEntryDate ||
    //   !roDate ||
    //   !roNumber ||
    //   !regNo ||
    //   !model ||
    //   !customerName ||
    //   !contactNo ||
    //   !serviceAdvisor ||
    //   !presentStatus
    // ) {
    //   return res.status(400).json({
    //     message:
    //       "Yard entry date, RO date, RO number, registration number, model, customer name, contact number and service advisor are required",
    //   });
    // }

    // Determine branch
    let assignedBranch;

    if (req.user.role === "admin") {
      if (!branch) {
        return res.status(400).json({
          message: "Branch is required for admin",
        });
      }

      assignedBranch = branch;
    } else {
      const assignedBranchIds = getAssignedBranchIds(req.user);

      if (assignedBranchIds.length === 0) {
        return res.status(400).json({
          message: "User does not have any assigned branches",
        });
      }

      if (!branch) {
        return res.status(400).json({
          message: "Please select a branch",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(branch)) {
        return res.status(400).json({
          message: "Invalid branch ID",
        });
      }

      if (!assignedBranchIds.includes(String(branch))) {
        return res.status(403).json({
          message: "You cannot create records for an unassigned branch",
        });
      }

      assignedBranch = branch;
    }
    // ----------------------------------
    // Check branch
    // ----------------------------------

    const existingBranch = await Branch.findById(assignedBranch);

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

    // ----------------------------------
    // Generate Sl No
    // ----------------------------------

    const lastRecord = await FormRecord.findOne()
      .sort({ slNo: -1 })
      .select("slNo");

    const slNo = lastRecord ? lastRecord.slNo + 1 : 1;

    if (!mongoose.Types.ObjectId.isValid(presentStatus)) {
      return res.status(400).json({
        message: "Invalid present status ID",
      });
    }

    const status = await Status.findOne({
      _id: presentStatus,
      isActive: true,
    });

    if (!status) {
      return res.status(400).json({
        message: "Invalid or inactive present status",
      });
    }

    // ----------------------------------
    // Create record
    // ----------------------------------

    const record = await FormRecord.create({
      slNo,

      branch: assignedBranch,

      createdBy: req.user._id,

      yardEntryDate,
      roDate,
      roNumber,
      regNo: regNo.toUpperCase(),
      model,
      customerName,
      contactNo,
      serviceAdvisor,

      whatsappGroupCreationDate,
      nextPmsDate,

      shieldEligibility,
      rsaEligibility,

      insuranceStatus,
      insuranceName,

      labourEstimate,
      partsEstimate,

      jobType,

      promisedDeliveryDate,

      presentStatus: status._id,

      labourBillAmount,
      partsBillAmount,

      billDate,
    });

    const createdStatus = await Status.findById(record.presentStatus).select(
      "name",
    );

    await RecordHistory.insertMany([
      {
        record: record._id,
        field: "presentStatus",
        action: "Created",
        oldValue: null,
        newValue: createdStatus?.name || "",
        changedBy: req.user._id,
      },
      {
        record: record._id,
        field: "promisedDeliveryDate",
        action: "Created",
        oldValue: null,
        newValue: record.promisedDeliveryDate
          ? new Date(record.promisedDeliveryDate).toISOString().slice(0, 10)
          : "",
        changedBy: req.user._id,
      },
      {
        record: record._id,
        field: "labourEstimate",
        action: "Created",
        oldValue: null,
        newValue: record.labourEstimate ?? null,
        changedBy: req.user._id,
      },
      {
        record: record._id,
        field: "partsEstimate",
        action: "Created",
        oldValue: null,
        newValue: record.partsEstimate ?? null,
        changedBy: req.user._id,
      },
    ]);

    // ----------------------------------
    // Return populated record
    // ----------------------------------

    const createdRecord = await FormRecord.findById(record._id)
      .populate("branch", "name code")
      .populate("createdBy", "name email role")
      .populate("presentStatus", "name section");

    res.status(201).json({
      message: "Form record created successfully",
      record: createdRecord,
    });
  } catch (error) {
    console.error("Create form record error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get form records
const getFormRecords = async (req, res) => {
  try {
    const { branch, search, page = 1, limit = 20 } = req.query;

    const filter = {};

    // Branch access control
    if (req.user.role === "admin") {
      // Admin can see all branches or filter by one branch
      if (branch) {
        if (!mongoose.Types.ObjectId.isValid(branch)) {
          return res.status(400).json({
            message: "Invalid branch ID",
          });
        }

        filter.branch = branch;
      }
    } else {
      const assignedBranchIds = getAssignedBranchIds(req.user);

      if (assignedBranchIds.length === 0) {
        return res.status(403).json({
          message: "User does not have any assigned branches",
        });
      }

      // Default: show records from all assigned branches
      filter.branch = {
        $in: assignedBranchIds,
      };

      // Optional filter: show one assigned branch
      if (branch) {
        if (!mongoose.Types.ObjectId.isValid(branch)) {
          return res.status(400).json({
            message: "Invalid branch ID",
          });
        }

        if (!assignedBranchIds.includes(String(branch))) {
          return res.status(403).json({
            message: "You do not have access to this branch",
          });
        }

        filter.branch = branch;
      }
    }

    // ----------------------------------
    // Search
    // ----------------------------------

    if (search?.trim()) {
      filter.$or = [
        {
          roNumber: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          regNo: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          customerName: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          contactNo: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // ----------------------------------
    // Pagination
    // ----------------------------------

    const currentPage = Math.max(Number(page), 1);
    const pageLimit = Math.max(Number(limit), 1);

    const skip = (currentPage - 1) * pageLimit;

    const totalRecords = await FormRecord.countDocuments(filter);

    const records = await FormRecord.find(filter)
      .populate("branch", "name code")
      .populate("createdBy", "name email role")
      .populate("presentStatus", "name section")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    const totalPages = Math.ceil(totalRecords / pageLimit);

    res.status(200).json({
      message: "Form records fetched successfully",

      records,

      pagination: {
        currentPage,
        limit: pageLimit,
        totalRecords,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get form records error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Update form record
const updateFormRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      branch,
      yardEntryDate,
      roDate,
      roNumber,
      regNo,
      model,
      customerName,
      contactNo,
      serviceAdvisor,
      whatsappGroupCreationDate,
      nextPmsDate,
      shieldEligibility,
      rsaEligibility,
      insuranceStatus,
      insuranceName,
      labourEstimate,
      partsEstimate,
      jobType,
      promisedDeliveryDate,
      presentStatus,
      labourBillAmount,
      partsBillAmount,
      billDate,
    } = req.body;

    // ----------------------------------
    // Find record
    // ----------------------------------

    const record = await FormRecord.findById(id);

    if (!record) {
      return res.status(404).json({
        message: "Form record not found",
      });
    }
    // Branch access control

    if (req.body.branch !== undefined && req.body.branch !== "") {
      const requestedBranchId = String(req.body.branch);

      if (req.user.role !== "admin") {
        const assignedBranchIds = getAssignedBranchIds(req.user);

        if (!assignedBranchIds.includes(requestedBranchId)) {
          return res.status(403).json({
            message: "You cannot move records to an unassigned branch",
          });
        }
      }

      record.branch = req.body.branch;
    }

    // ----------------------------------
    // Admin can change branch
    // ----------------------------------

    if (req.user.role === "admin" && branch) {
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

      record.branch = branch;
    }

    const previousStatus = record.presentStatus
      ? await Status.findById(record.presentStatus).select("name")
      : null;

    const previousValues = {
      presentStatus: previousStatus?.name || "",
      promisedDeliveryDate: record.promisedDeliveryDate
        ? new Date(record.promisedDeliveryDate).toISOString().slice(0, 10)
        : "",
      labourEstimate: record.labourEstimate ?? null,
      partsEstimate: record.partsEstimate ?? null,
    };

    // ----------------------------------
    // Update fields
    // ----------------------------------

    if (yardEntryDate !== undefined) {
      record.yardEntryDate = yardEntryDate;
    }

    if (roDate !== undefined) {
      record.roDate = roDate;
    }

    if (roNumber !== undefined) {
      record.roNumber = roNumber;
    }

    if (regNo !== undefined) {
      record.regNo = regNo.toUpperCase();
    }

    if (model !== undefined) {
      record.model = model;
    }

    if (customerName !== undefined) {
      record.customerName = customerName;
    }

    if (contactNo !== undefined) {
      record.contactNo = contactNo;
    }

    if (serviceAdvisor !== undefined) {
      record.serviceAdvisor = serviceAdvisor;
    }

    if (whatsappGroupCreationDate !== undefined) {
      record.whatsappGroupCreationDate = whatsappGroupCreationDate;
    }

    if (nextPmsDate !== undefined) {
      record.nextPmsDate = nextPmsDate;
    }

    if (shieldEligibility !== undefined) {
      record.shieldEligibility = shieldEligibility;
    }

    if (rsaEligibility !== undefined) {
      record.rsaEligibility = rsaEligibility;
    }

    if (insuranceStatus !== undefined) {
      record.insuranceStatus = insuranceStatus;
    }

    if (insuranceName !== undefined) {
      record.insuranceName = insuranceName;
    }

    if (labourEstimate !== undefined) {
      record.labourEstimate = labourEstimate;
    }

    if (partsEstimate !== undefined) {
      record.partsEstimate = partsEstimate;
    }

    if (jobType !== undefined) {
      record.jobType = jobType;
    }

    if (promisedDeliveryDate !== undefined) {
      record.promisedDeliveryDate = promisedDeliveryDate;
    }

    if (presentStatus !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(presentStatus)) {
        return res.status(400).json({
          message: "Invalid present status ID",
        });
      }

      const status = await Status.findOne({
        _id: presentStatus,
        isActive: true,
      });

      if (!status) {
        return res.status(400).json({
          message: "Invalid or inactive present status",
        });
      }

      record.presentStatus = status._id;
    }
    if (labourBillAmount !== undefined) {
      record.labourBillAmount = labourBillAmount;
    }

    if (partsBillAmount !== undefined) {
      record.partsBillAmount = partsBillAmount;
    }

    if (billDate !== undefined) {
      record.billDate = billDate;
    }

    const currentStatus = record.presentStatus
      ? await Status.findById(record.presentStatus).select("name")
      : null;

    const currentValues = {
      presentStatus: currentStatus?.name || "",
      promisedDeliveryDate: record.promisedDeliveryDate
        ? new Date(record.promisedDeliveryDate).toISOString().slice(0, 10)
        : "",
      labourEstimate: record.labourEstimate ?? null,
      partsEstimate: record.partsEstimate ?? null,
    };

    const fieldNames = {
      presentStatus: "Present Status",
      promisedDeliveryDate: "Promise Delivery Date",
      labourEstimate: "Labour Estimate",
      partsEstimate: "Parts Estimate",
    };

    const historyEntries = Object.keys(fieldNames)
      .filter(
        (field) =>
          JSON.stringify(previousValues[field]) !==
          JSON.stringify(currentValues[field]),
      )
      .map((field) => ({
        record: record._id,
        field,
        action: "Updated",
        oldValue: previousValues[field],
        newValue: currentValues[field],
        changedBy: req.user._id,
      }));

    await record.save();

    if (historyEntries.length > 0) {
      await RecordHistory.insertMany(historyEntries);
    }

    // ----------------------------------
    // Return updated record
    // ----------------------------------

    const updatedRecord = await FormRecord.findById(record._id)
      .populate("branch", "name code")
      .populate("createdBy", "name email role")
      .populate("presentStatus", "name section");

    res.status(200).json({
      message: "Form record updated successfully",
      record: updatedRecord,
    });
  } catch (error) {
    console.error("Update form record error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


const deleteFormRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid record ID",
      });
    }

    const record = await FormRecord.findById(id);

    if (!record) {
      return res.status(404).json({
        message: "Form record not found",
      });
    }

    // Branch access control: admins can delete any record.
    // Other roles can delete only within their assigned branches.
    if (req.user.role !== "admin") {
      const assignedBranchIds = getAssignedBranchIds(req.user);

      if (!assignedBranchIds.includes(String(record.branch))) {
        return res.status(403).json({
          message: "You cannot delete records from an unassigned branch",
        });
      }
    }

    // Remove related history before deleting the record.
    await RecordHistory.deleteMany({
      record: record._id,
    });

    await record.deleteOne();

    return res.status(200).json({
      message: "Form record deleted successfully",
      deletedRecordId: id,
    });
  } catch (error) {
    console.error("Delete form record error:", error);

    return res.status(500).json({
      message: "Failed to delete form record",
    });
  }
};


const getFormRecordHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await FormRecord.findById(id).select("_id branch");

    if (!record) {
      return res.status(404).json({
        message: "Form record not found",
      });
    }

    // Users can only view history for their assigned branch.
    if (req.user.role !== "admin") {
      const assignedBranchIds = getAssignedBranchIds(req.user);

      if (assignedBranchIds.length === 0) {
        return res.status(403).json({
          message: "User does not have any assigned branches",
        });
      }

      if (!assignedBranchIds.includes(String(record.branch))) {
        return res.status(403).json({
          message: "You cannot view history from an unassigned branch",
        });
      }
    }

    const history = await RecordHistory.find({
      record: id,
    })
      .populate("changedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Record history fetched successfully",
      history,
    });
  } catch (error) {
    console.error("Get record history error:", error);

    return res.status(500).json({
      message: "Failed to fetch record history",
    });
  }
};

module.exports = {
  createFormRecord,
  getFormRecords,
  updateFormRecord,
  getFormRecordHistory,
  deleteFormRecord,
};
