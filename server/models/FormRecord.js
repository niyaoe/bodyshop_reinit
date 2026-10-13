const mongoose = require("mongoose");

const formRecordSchema = new mongoose.Schema(
  {
    slNo: {
      type: Number,
    },

    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      // required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },

    yardEntryDate: {
      type: Date,
      // required: true,
    },

    roDate: {
      type: Date,
      // required: true,
    },

    roNumber: {
      type: String,
      // required: true,
      trim: true,
    },

    regNo: {
      type: String,
      // required: true,
      uppercase: true,
      trim: true,
      match: [/^\S+$/, "Registration number cannot contain spaces"],
    },

    model: {
      type: String,
      // required: true,
      trim: true,
    },

    customerName: {
      type: String,
      // required: true,
      trim: true,
    },

    contactNo: {
      type: String,
      // required: true,
      match: [/^\d{10}$/, "Contact number must be 10 digits"],
    },

    serviceAdvisor: {
      type: String,
      // required: true,
      trim: true,
    },

    whatsappGroupCreationDate: {
      type: Date,
    },

    nextPmsDate: {
      type: Date,
    },

    shieldEligibility: {
      type: String,
      // enum: ["Yes", "No"],
    },

    rsaEligibility: {
      type: String,
      // enum: ["Yes", "No"],
    },

    insuranceStatus: {
      type: String,
      // enum: ["In-House", "Out-Side", "Cash", "Warranty"],
    },

    insuranceName: {
      type: String,
      trim: true,
    },

    labourEstimate: {
      type: Number,
      min: 0,
    },

    partsEstimate: {
      type: Number,
      min: 0,
    },

    jobType: {
      type: String,
      // enum: ["M1", "M2", "M3", "M4"],
    },

    promisedDeliveryDate: {
      type: Date,
    },

    presentStatus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      required: true,
    },

    labourBillAmount: {
      type: Number,
      min: 0,
    },

    partsBillAmount: {
      type: Number,
      min: 0,
    },

    billDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("FormRecord", formRecordSchema);
