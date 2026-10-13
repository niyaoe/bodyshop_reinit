
const mongoose = require("mongoose");

const recordHistorySchema = new mongoose.Schema(
  {
    record: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormRecord",
      required: true,
      index: true,
    },

    field: {
      type: String,
      enum: [
        "presentStatus",
        "promisedDeliveryDate",
        "labourEstimate",
        "partsEstimate",
      ],
      required: true,
    },

    action: {
      type: String,
      enum: ["Created", "Updated"],
      required: true,
    },

    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("RecordHistory", recordHistorySchema);
