const mongoose = require("mongoose");

const inspectionResultSchema = new mongoose.Schema(
  {
    code: {
      type: Number,
      required: true,
    },
    result: {
      type: String,
      enum: ["", "OK", "Not OK", "Not Applicable"],
      default: "",
    },
    recheck: {
      type: String,
      enum: ["", "OK", "Not OK", "Not Applicable"],
      default: "",
    },
  },
  { _id: false },
);

const q1Schema = new mongoose.Schema(
  {
    items: {
      type: [inspectionResultSchema],
      default: [],
    },

    techNames: {
      denting: { type: String, default: "" },
      migBrazingWelding: { type: String, default: "" },
      antiRustApplication: { type: String, default: "" },
      spotWelding: { type: String, default: "" },
      pullingMeasurement: { type: String, default: "" },
    },

    checkedBy: { type: String, default: "" },
    reviewedBy: { type: String, default: "" },
    approvedBy: { type: String, default: "" },
  },

  { _id: false },

);

const q2Schema = new mongoose.Schema(
  {
    items: {
      type: [inspectionResultSchema],
      default: [],
    },

    techNames: {
      putty: { type: String, default: "" },
      primerSurfacer: { type: String, default: "" },
      masking: { type: String, default: "" },
      colourMatchingPainting: { type: String, default: "" },
      polishing: { type: String, default: "" },
    },

    checkedBy: { type: String, default: "" },
    reviewedBy: { type: String, default: "" },
    approvedBy: { type: String, default: "" },
  },

  { _id: false },

);


const q3Schema = new mongoose.Schema(
  {
    items: {
      type: [inspectionResultSchema],
      default: [],
    },

    remarks: {
      type: String,
      default: "",
    },

    recommendations: {
      type: String,
      default: "",
    },

    finalInspectorResult: {
      type: String,
      enum: ["", "OK", "Not OK"],
      default: "",
    },

    reInspectionDate: {
      type: String,
      default: "",
    },

    checkedBy: {
      type: String,
      default: "",
    },

    reviewedBy: {
      type: String,
      default: "",
    },

    approvedBy: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);


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
      required: true,
      uppercase: true,
      trim: true,
      set: (value) =>
        typeof value === "string"
          ? value.replace(/\s+/g, "").toUpperCase()
          : value,
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

    voiceToCustomer: {
      type: String,
      default: "",
      trim: true,
    },

    bodyshopRemarks: {
      type: String,
      default: "",
      trim: true,
    },
    q1: {
      type: q1Schema,
      default: null,
    },
    q2: {
      type: q2Schema,
      default: null,
    },
    q3: {
      type: q3Schema,
      default: null,
    },
  },
  {
    timestamps: true,
  },

);

module.exports = mongoose.model("FormRecord", formRecordSchema);
