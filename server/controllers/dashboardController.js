const User = require("../models/User");
const Branch = require("../models/Branch");
const FormRecord = require("../models/FormRecord");
const Status = require("../models/Status");
const VehicleModel = require("../models/VehicleModel");
const mongoose = require("mongoose");

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

const getDashboard = async (req, res) => {
  try {
    const {
      branch,
      section,
      fromDate,
      toDate,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // ----------------------------------
    // Branch access control
    // ----------------------------------

    if (req.user.role === "admin") {
      // Admin can see all branches or filter by one branch
      if (branch) {
        if (!mongoose.Types.ObjectId.isValid(branch)) {
          return res.status(400).json({
            message: "Invalid branch ID",
          });
        }

        filter.branch = new mongoose.Types.ObjectId(branch);
      }
    } else {
      const assignedBranchIds = getAssignedBranchIds(req.user);

      if (assignedBranchIds.length === 0) {
        return res.status(403).json({
          message: "User does not have any assigned branches",
        });
      }

      // Default: all assigned branches
      filter.branch = {
        $in: assignedBranchIds.map((id) => new mongoose.Types.ObjectId(id)),
      };

      // Optional: filter to one assigned branch
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

        filter.branch = new mongoose.Types.ObjectId(branch);
      }
    }

    // ----------------------------------
    // Date filter
    // ----------------------------------

    if (fromDate || toDate) {
      filter.promisedDeliveryDate = {};

      if (fromDate) {
        filter.promisedDeliveryDate.$gte = new Date(`${fromDate}T00:00:00.000Z`);
      }

      if (toDate) {
        filter.promisedDeliveryDate.$lte = new Date(`${toDate}T23:59:59.999Z`);
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
        {
          model: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // Keep branch, date and search filters for section summaries
    const summaryFilter = { ...filter };

    // ----------------------------------
    // Status section filter
    // ----------------------------------

    if (section) {
      const allowedSections = ["legalLoss", "billed", "open"];

      if (!allowedSections.includes(section)) {
        return res.status(400).json({
          message: "Invalid dashboard section",
        });
      }

      const statuses = await Status.find({
        section,
        isActive: true,
      }).select("_id");

      const statusIds = statuses.map((status) => status._id);

      filter.presentStatus = {
        $in: statusIds,
      };
    }


    // ----------------------------------
    // Summary tile filter
    // ----------------------------------

    const { summaryTile, statusId } = req.query;

    if (summaryTile) {
      const tileSections = {
        open: "open",
        billed: "billed",
        legalLoss: "legalLoss",
      };

      if (tileSections[summaryTile]) {
        const tileStatuses = await Status.find({
          section: tileSections[summaryTile],
          isActive: true,
        }).select("_id");

        filter.presentStatus = {
          $in: tileStatuses.map((status) => status._id),
        };
      } else {
        const amountFields = {
          openLabourEstimate: {
            section: "open",
            field: "labourEstimate",
          },
          openPartsEstimate: {
            section: "open",
            field: "partsEstimate",
          },
          legalLossLabourEstimate: {
            section: "legalLoss",
            field: "labourEstimate",
          },
          legalLossPartsEstimate: {
            section: "legalLoss",
            field: "partsEstimate",
          },
          billedLabourBill: {
            section: "billed",
            field: "labourBillAmount",
          },
          billedPartsBill: {
            section: "billed",
            field: "partsBillAmount",
          },
        };

        const amountConfig = amountFields[summaryTile];

        if (amountConfig) {
          const tileStatuses = await Status.find({
            section: amountConfig.section,
            isActive: true,
          }).select("_id");

          filter.presentStatus = {
            $in: tileStatuses.map((status) => status._id),
          };

          filter[amountConfig.field] = { $gt: 0 };
        } else if (summaryTile !== "status") {
          return res.status(400).json({
            message: "Invalid summary tile",
          });
        }
      }
    }

    if (statusId) {
      const selectedStatus = await Status.findById(statusId).select(
        "_id section isActive"
      );

      if (!selectedStatus || !selectedStatus.isActive) {
        return res.status(400).json({
          message: "Invalid or inactive status",
        });
      }

      filter.presentStatus = selectedStatus._id;
    }


    // ----------------------------------
    // Pagination
    // ----------------------------------

    const currentPage = Math.max(Number(page), 1);
    const pageLimit = Math.max(Number(limit), 1);

    const skip = (currentPage - 1) * pageLimit;

    // ----------------------------------
    // Total records
    // ----------------------------------

    const totalRecords = await FormRecord.countDocuments(filter);

    // ----------------------------------
    // Open section status summary
    // ----------------------------------

    const openStatuses = await Status.find({
      section: "open",
      isActive: true,
    }).select("_id name");

    const openStatusIds = openStatuses.map((status) => status._id);

    const openSummaryStats = await FormRecord.aggregate([
      {
        $match: {
          ...summaryFilter,
          presentStatus: { $in: openStatusIds },
        },
      },
      {
        $group: {
          _id: null,

          totalOpenRecords: { $sum: 1 },

          totalLabourEstimate: {
            $sum: { $ifNull: ["$labourEstimate", 0] },
          },

          totalPartsEstimate: {
            $sum: { $ifNull: ["$partsEstimate", 0] },
          },
        },
      },
    ]);

    const openStatusCounts = await FormRecord.aggregate([
      {
        $match: {
          ...summaryFilter,
          presentStatus: { $in: openStatusIds },
        },
      },
      {
        $group: {
          _id: "$presentStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const countByStatusId = new Map(
      openStatusCounts.map((item) => [item._id.toString(), item.count]),
    );

    const openStats = openSummaryStats[0] || {
      totalOpenRecords: 0,
      totalLabourEstimate: 0,
      totalPartsEstimate: 0,
    };

    const openStatusSummary = {
      totalOpenRecords: openStats.totalOpenRecords,
      totalLabourEstimate: openStats.totalLabourEstimate,
      totalPartsEstimate: openStats.totalPartsEstimate,

      statuses: openStatuses.map((status) => ({
        id: status._id,
        name: status.name,
        count: countByStatusId.get(status._id.toString()) || 0,
      })),
    };

    // ----------------------------------
    // Billed section summary
    // ----------------------------------

    const billedStatuses = await Status.find({
      section: "billed",
      isActive: true,
    }).select("_id");

    const billedStatusIds = billedStatuses.map((status) => status._id);

    const billedSummaryStats = await FormRecord.aggregate([
      {
        $match: {
          ...summaryFilter,
          presentStatus: { $in: billedStatusIds },
        },
      },
      {
        $group: {
          _id: null,

          totalBilledRecords: { $sum: 1 },

          totalLabourBill: {
            $sum: { $ifNull: ["$labourBillAmount", 0] },
          },

          totalPartsBill: {
            $sum: { $ifNull: ["$partsBillAmount", 0] },
          },
        },
      },
    ]);

    const billedStats = billedSummaryStats[0] || {
      totalBilledRecords: 0,
      totalLabourBill: 0,
      totalPartsBill: 0,
    };

    const billedStatusSummary = {
      totalBilledRecords: billedStats.totalBilledRecords,
      totalLabourBill: billedStats.totalLabourBill,
      totalPartsBill: billedStats.totalPartsBill,
    };

    // ----------------------------------
    // Legal / Loss section summary
    // ----------------------------------

    const legalLossStatuses = await Status.find({
      section: "legalLoss",
      isActive: true,
    }).select("_id");

    const legalLossStatusIds = legalLossStatuses.map((status) => status._id);

    const legalLossSummaryStats = await FormRecord.aggregate([
      {
        $match: {
          ...summaryFilter,
          presentStatus: { $in: legalLossStatusIds },
        },
      },
      {
        $group: {
          _id: null,
          totalLegalLossRecords: { $sum: 1 },
          totalLabourEstimate: {
            $sum: { $ifNull: ["$labourEstimate", 0] },
          },
          totalPartsEstimate: {
            $sum: { $ifNull: ["$partsEstimate", 0] },
          },
        },
      },
    ]);

    const legalLossStats = legalLossSummaryStats[0] || {
      totalLegalLossRecords: 0,
      totalLabourEstimate: 0,
      totalPartsEstimate: 0,
    };

    const legalLossSummary = {
      totalLegalLossRecords: legalLossStats.totalLegalLossRecords,
      totalLabourEstimate: legalLossStats.totalLabourEstimate,
      totalPartsEstimate: legalLossStats.totalPartsEstimate,
    };

    // ----------------------------------
    // Records
    // ----------------------------------

    let records = await FormRecord.find(filter)
      .populate("branch", "name code")
      .populate("createdBy", "name email role")
      .populate("presentStatus", "name section")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    // Add sub-segment name based on the vehicle model
    const vehicleModels = await VehicleModel.find({
      isActive: true,
    }).select("name subSegmentName");

    const modelMap = new Map(
      vehicleModels.map((item) => [
        item.name.trim().toLowerCase(),
        item.subSegmentName || "",
      ]),
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    records = records.map((record) => {
      const item = record.toObject();

      item.subSegmentName = (
        modelMap.get(item.model?.trim().toLowerCase()) || ""
      ).toUpperCase();

      const promiseDate = item.promisedDeliveryDate
        ? new Date(item.promisedDeliveryDate)
        : null;

      if (!promiseDate) {
        // Empty promise delivery date
        item.isDeliveryOverdue = true;
        item.deliveryDaysOverdue = null;
      } else {
        promiseDate.setHours(0, 0, 0, 0);

        const daysOverdue = Math.floor(
          (today.getTime() - promiseDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        item.isDeliveryOverdue = daysOverdue >= 1;
        item.deliveryDaysOverdue = daysOverdue;
      }

      // imp without blank

      // if (promiseDate) {
      //   promiseDate.setHours(0, 0, 0, 0);

      //   const daysOverdue = Math.floor(
      //     (today.getTime() - promiseDate.getTime()) / (1000 * 60 * 60 * 24),
      //   );

      //   item.isDeliveryOverdue = daysOverdue >= 1;
      //   item.deliveryDaysOverdue = daysOverdue;
      // } else {
      //   item.isDeliveryOverdue = false;
      //   item.deliveryDaysOverdue = 0;
      // }

      return item;
    });

    const totalPages = Math.ceil(totalRecords / pageLimit);

    // ----------------------------------
    // Statistics
    // ----------------------------------

    const statistics = await FormRecord.aggregate([
      {
        $match: filter,
      },

      {
        $group: {
          _id: null,

          totalRecords: {
            $sum: 1,
          },

          totalLabourEstimate: {
            $sum: {
              $ifNull: ["$labourEstimate", 0],
            },
          },

          totalPartsEstimate: {
            $sum: {
              $ifNull: ["$partsEstimate", 0],
            },
          },

          totalLabourBill: {
            $sum: {
              $ifNull: ["$labourBillAmount", 0],
            },
          },

          totalPartsBill: {
            $sum: {
              $ifNull: ["$partsBillAmount", 0],
            },
          },
        },
      },
    ]);

    const summary = statistics[0] || {
      totalRecords: 0,
      totalLabourEstimate: 0,
      totalPartsEstimate: 0,
      totalLabourBill: 0,
      totalPartsBill: 0,
    };

    // ----------------------------------
    // Job Type statistics
    // ----------------------------------

    const jobTypeStats = await FormRecord.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: "$jobType",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    // ----------------------------------
    // Insurance statistics
    // ----------------------------------

    const insuranceStats = await FormRecord.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: "$insuranceStatus",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    // ----------------------------------
    // Shield statistics
    // ----------------------------------

    const shieldStats = await FormRecord.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: "$shieldEligibility",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // ----------------------------------
    // RSA statistics
    // ----------------------------------

    const rsaStats = await FormRecord.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: "$rsaEligibility",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    // ----------------------------------
    // Branch statistics
    // Admin only
    // ----------------------------------

    let branchStats = [];

    if (req.user.role === "admin") {
      branchStats = await FormRecord.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: "$branch",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $lookup: {
            from: "branches",
            localField: "_id",
            foreignField: "_id",
            as: "branch",
          },
        },
        {
          $unwind: "$branch",
        },
        {
          $project: {
            _id: 0,
            branchId: "$branch._id",
            branchName: "$branch.name",
            branchCode: "$branch.code",
            count: 1,
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]);
    }

    // ----------------------------------
    // Admin statistics
    // ----------------------------------

    let adminStats = {};

    if (req.user.role === "admin") {
      adminStats = {
        totalUsers: await User.countDocuments({
          role: "user",
          isActive: true,
        }),

        totalBranches: await Branch.countDocuments({
          isActive: true,
        }),
      };
    }

    // ----------------------------------
    // Response
    // ----------------------------------

    res.status(200).json({
      message: "Dashboard data fetched successfully",

      summary: {
        totalRecords: summary.totalRecords,
        totalLabourEstimate: summary.totalLabourEstimate,
        totalPartsEstimate: summary.totalPartsEstimate,
        totalLabourBill: summary.totalLabourBill,
        totalPartsBill: summary.totalPartsBill,
        ...adminStats,
      },
      openStatusSummary,
      billedStatusSummary,
      legalLossSummary,

      statistics: {
        jobType: jobTypeStats,
        insurance: insuranceStats,
        shield: shieldStats,
        rsa: rsaStats,
        branches: branchStats,
      },

      records,

      pagination: {
        currentPage,
        limit: pageLimit,
        totalRecords,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getDashboard,
};
