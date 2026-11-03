import { useEffect, useState } from "react";
import api from "../api/axios";

import {
  createFormRecord,
  updateFormRecord,
  getBranches,
  getStatuses,
} from "../services/formService";

import "./FormModal.css";

const initialForm = {
  branch: "",

  yardEntryDate: "",

  roDate: "",

  roNumber: "",

  regNo: "",

  model: "",

  customerName: "",

  contactNo: "",

  serviceAdvisor: "",

  whatsappGroupCreationDate: "",

  nextPmsDate: "",

  shieldEligibility: "",

  rsaEligibility: "",

  insuranceStatus: "",

  insuranceName: "",

  labourEstimate: "",

  partsEstimate: "",

  jobType: "",

  promisedDeliveryDate: "",

  presentStatus: "",

  labourBillAmount: "",

  partsBillAmount: "",
  labourBillAmountWithGst: "",
  partsBillAmountWithGst: "",
  depreciationAmount: "",

  billDate: "",
  voiceToCustomer: "",
  bodyshopRemarks: "",
};


const calculateRoAging = (roDate) => {
  if (!roDate) return null;

  const date = new Date(`${roDate.slice(0, 10)}T00:00:00`);
  const today = new Date();

  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.floor((today - date) / (1000 * 60 * 60 * 24));
};

const q1Categories = [
  {
    key: "denting",
    title: "Denting",
    codes: [1, 2, 3, 4, 5, 6],
  },
  {
    key: "migBrazingWelding",
    title: "MIG / Brazing Welding",
    codes: [7, 8, 9, 10],
  },
  {
    key: "antiRustApplication",
    title: "Anti-Rust Application",
    codes: [11, 12],
  },
  {
    key: "spotWelding",
    title: "Spot Welding",
    codes: [13, 14, 15],
  },
  {
    key: "pullingMeasurement",
    title: "Pulling & Measurement",
    codes: [16],
  },
];

const q1InspectionItems = [
  {
    code: 1,
    item: "Check dent repair area",
    standard: "No Waviness or Unevenness",
    method: "Scale / By Hand",
  },
  {
    code: 2,
    item: "Check dent repair area",
    standard: "No Canning or Looseness",
    method: "By Hand",
  },
  {
    code: 3,
    item: "Check for hole and burnt mark",
    standard: "No Hole and No Burnt mark",
    method: "Visual",
  },
  {
    code: 4,
    item: "Check feather edge",
    standard: "Feather Edge Width >20 mm",
    method: "Scale / By Hand",
  },
  {
    code: 5,
    item: "Check epoxy primer application area",
    standard: "No visible bare metal",
    method: "Visual",
  },
  {
    code: 6,
    item: "Check surface area and press line",
    standard: "No Deformations & No Waviness",
    method: "By Hand",
  },
  {
    code: 7,
    item: "Check panel cut and joining position",
    standard: "As per body repair manual",
    method: "Visual",
  },
  {
    code: 8,
    item: "Check gaps and flushness of new parts fitting",
    standard: "Gap & Flushness as per body repair manual",
    method: "Taper",
  },
  {
    code: 9,
    item: "Check Plug Welding Locations & Numbers",
    standard: "As per body repair manual",
    method: "Visual",
  },
  {
    code: 10,
    item: "Check welding quality",
    standard: "No Blow hole, No Undercut, No Porosity & No Spatter",
    method: "Visual",
  },
  {
    code: 11,
    item: "Check Body Sealant application",
    standard: "Uniform Finish, No crack & No excess sealant",
    method: "Visual",
  },
  {
    code: 12,
    item: "Check Antirust application",
    standard: "No overspray & No visible burnt area",
    method: "Visual",
  },
  {
    code: 13,
    item: "Check Weld thru application",
    standard: "No overspray",
    method: "Visual",
  },
  {
    code: 14,
    item: "Check spot welding Numbers",
    standard: "Body Repair Manual",
    method: "Visual",
  },
  {
    code: 15,
    item: "Check Spot welding quality",
    standard: "No Spot Burn No Spot Burr",
    method: "Visual",
  },
  {
    code: 16,
    item: "Compare actual body dimensions with standard body dimensions",
    standard: "Dimensional tolerance ± 3.0 mm as per CRS Data",
    method: "2D/3D CRS Report",
  },
];

const q1Options = ["OK", "Not OK", "Not Applicable"];

const q2Categories = [
  {
    key: "putty",
    title: "Putty",
    codes: [1, 2, 3, 4],
  },
  {
    key: "primerSurfacer",
    title: "Primer Surfacer",
    codes: [5, 6, 7, 8],
  },
  {
    key: "masking",
    title: "Masking",
    codes: [9, 10],
  },
  {
    key: "colourMatchingPainting",
    title: "Colour Matching & Painting",
    codes: [11, 12, 13],
  },
  {
    key: "polishing",
    title: "Polishing",
    codes: [14, 15, 16],
  },
];

const q2InspectionItems = [
  {
    code: 1,
    item: "Check feather edge area",
    standard: "Putty applied within feather edge area",
    method: "Visual",
  },
  {
    code: 2,
    item: "Check putty area",
    standard: "No Pinholes",
    method: "Visual",
  },
  {
    code: 3,
    item: "Check putty area",
    standard: "No Sanding Marks",
    method: "Visual",
  },
  {
    code: 4,
    item: "Check surface area and press line",
    standard: "No deformations",
    method: "Visual / By Hand",
  },
  {
    code: 5,
    item: "Check Coverage of Primer Surfacer",
    standard: "No putty should be visible",
    method: "Visual",
  },
  {
    code: 6,
    item: "Check Primer Surfacer application",
    standard: "No Dusts, No Run Down",
    method: "Visual",
  },
  {
    code: 7,
    item: "Check Primer Surfacer sanding",
    standard: "No Sanding Marks & No Pinholes",
    method: "Visual",
  },
  {
    code: 8,
    item: "Check Primer Surfacer sanding",
    standard: "No Bare metal exposed after Primer Surfacer sanding",
    method: "Visual",
  },
  {
    code: 9,
    item: "Check masking on surrounding panels",
    standard: "No open area of surrounded parts",
    method: "Visual",
  },
  {
    code: 10,
    item: "Check adjacent Trims & Gaps",
    standard: "No open trims & No uncovered Gaps",
    method: "Visual",
  },
  {
    code: 11,
    item: "Check colour on test panel at 3 angles - 90°, 45°, 15°",
    standard: "No mismatch with adjacent panels",
    method: "Visual",
  },
  {
    code: 12,
    item: "Check Paint finish quality",
    standard: "Uniform paint finish, No Run Down, No Orange Peel",
    method: "Visual",
  },
  {
    code: 13,
    item: "Check Paint finish quality",
    standard: "No Dust, No Pinhole, No Fish-eye, No Overspray",
    method: "Visual",
  },
  {
    code: 14,
    item: "Check Spot Repair Painting area / Fade Out area",
    standard: "Clear Coat joint should not be visible",
    method: "Visual",
  },
  {
    code: 15,
    item: "Check polishing quality",
    standard: "No mis-match of Gloss & Texture with adjacent panel",
    method: "Visual",
  },
  {
    code: 16,
    item: "Check polishing area finish",
    standard: "No polishing marks / No polishing compound",
    method: "Visual",
  },
];


const q3Categories = [
  {
    key: "cleaningWashing",
    title: "Cleaning / Washing",
    codes: [1, 2, 3],
  },
  {
    key: "body",
    title: "Body",
    codes: [4, 5, 6, 7, 8, 9, 10, 11],
  },
  {
    key: "paint",
    title: "Paint",
    codes: Array.from({ length: 13 }, (_, i) => i + 12),
  },
  {
    key: "functionalCheck",
    title: "Functional Check",
    codes: Array.from({ length: 17 }, (_, i) => i + 25),
  },
];

const q3InspectionItems = [
  "Exterior Cleaning",
  "Polish Compound Cleaning",
  "Interior Cleaning",
  "Shape of Panel (waviness/dent/press lines)",
  "Gaps / Alignment / Flushness",
  "Scratches / damage on parts",
  "Improper Parts fitment",
  "Opening / Closing (Doors, Hood, Tail gate)",
  "Suspension / Wheels Torque",
  "Windshield Glass Fitment",
  "Water Leakage Check",
  "Colour Mismatch",
  "Dust",
  "Run Down",
  "Orange Peel",
  "Fish Eyes",
  "Gloss",
  "Mottling",
  "Paint shrinking",
  "Pinholes in putty",
  "Sanding Scratches",
  "Overspray",
  "Paint Cut – Over Polishing",
  "Polishing – Swirl Marks",
  "All new parts fitted",
  "Headlights / Taillights",
  "All Lights (outside / Inside)",
  "Seat belts",
  "Window Glass / OVRM",
  "Lock / Unlock / Remote",
  "All Electricals / MIL",
  "A/C and Heating",
  "Steering Controls / Audio",
  "Reverse Camera / Sensors",
  "Parking Brake",
  "Battery Condition",
  "All Fluids Level (Engine oil, brake fluid, coolant, Wiper)",
  "Wheel Alignment",
  "Test Drive",
  "Abnormal Noise",
  "Others",
].map((item, index) => ({
  code: index + 1,
  item,
}));

const q3Options = ["OK", "Not OK", "Not Applicable"];





function FormModal({ isOpen, onClose, editRecord = null, onSuccess }) {
  const user = JSON.parse(localStorage.getItem("user"));

  const [form, setForm] = useState(initialForm);

  const [branches, setBranches] = useState([]);

  const [statuses, setStatuses] = useState([]);

  const [loading, setLoading] = useState(false);

  const [loadingData, setLoadingData] = useState(false);

  const [error, setError] = useState("");

  const [vehicleModels, setVehicleModels] = useState([]);

  const [insuranceCompanies, setInsuranceCompanies] = useState([]);

  const [serviceAdvisors, setServiceAdvisors] = useState([]);

  const isEditMode = Boolean(editRecord);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [recordHistory, setRecordHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");



  const [activeView, setActiveView] = useState("record");

  const [q1Data, setQ1Data] = useState(null);
  const [q1Loading, setQ1Loading] = useState(false);
  const [q1Saving, setQ1Saving] = useState(false);
  const [q1Error, setQ1Error] = useState("");


  const [q2Data, setQ2Data] = useState(null);
  const [q2Loading, setQ2Loading] = useState(false);
  const [q2Saving, setQ2Saving] = useState(false);
  const [q2Error, setQ2Error] = useState("");


  const [q3Data, setQ3Data] = useState(null);
  const [q3Loading, setQ3Loading] = useState(false);
  const [q3Saving, setQ3Saving] = useState(false);
  const [q3Error, setQ3Error] = useState("");
  /*

   * Load branches and statuses

   */

  const backToRecord = () => {
    setHistoryOpen(false)
    onClose()

  }

  const fetchVehicleModels = async () => {
    try {
      const response = await api.get("/vehicle-models");
      setVehicleModels(response.data.vehicleModels || []);
    } catch (error) {
      console.error("Failed to load vehicle models:", error);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const loadFormData = async () => {
      try {
        setLoadingData(true);
        setError("");

        const [statusData, modelData, insuranceData, advisorData] =
          await Promise.all([
            getStatuses(),
            api.get("/vehicle-models"),
            api.get("/insurance-companies"),
            // api.get("/service-advisors"),
          ]);

        setStatuses(statusData.statuses || statusData || []);

        setVehicleModels(modelData.data.vehicleModels || []);

        setInsuranceCompanies(insuranceData.data.insuranceCompanies || []);

        // setServiceAdvisors(advisorData.data.serviceAdvisors || []);

        if (user?.role === "admin") {
          const branchData = await getBranches();
          setBranches(branchData.branches || branchData || []);
        } else {
          // Use all branches assigned to the logged-in user.
          const assignedBranches =
            user?.branches?.length > 0
              ? user.branches
              : user?.branch
                ? [user.branch]
                : [];

          setBranches(assignedBranches);
        }
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load form data");
      } finally {
        setLoadingData(false);
      }
    };

    loadFormData();
  }, [isOpen, user?.role]);

  useEffect(() => {
    if (!isOpen || !form.branch) {
      setServiceAdvisors([]);
      return;
    }

    const fetchServiceAdvisors = async () => {
      try {
        const response = await api.get("/service-advisors", {
          params: { branch: form.branch },
        });

        setServiceAdvisors(
          response.data.serviceAdvisors || []
        );
      } catch (error) {
        console.error("Failed to load service advisors:", error);
        setServiceAdvisors([]);
      }
    };

    fetchServiceAdvisors();
  }, [isOpen, form.branch]);

  /*

   * Fill form when editing

   */

  useEffect(() => {
    if (!isOpen) return;

    if (editRecord) {
      setForm({
        branch: editRecord.branch?._id || editRecord.branch || "",

        yardEntryDate: formatDateForInput(editRecord.yardEntryDate),

        roDate: formatDateForInput(editRecord.roDate),

        roNumber: editRecord.roNumber || "",

        regNo: editRecord.regNo || "",

        model: editRecord.model || "",

        customerName: editRecord.customerName || "",

        contactNo: editRecord.contactNo || "",

        serviceAdvisor: editRecord.serviceAdvisor || "",

        whatsappGroupCreationDate: formatDateForInput(
          editRecord.whatsappGroupCreationDate,
        ),

        nextPmsDate: formatDateForInput(editRecord.nextPmsDate),

        shieldEligibility: editRecord.shieldEligibility || "",

        rsaEligibility: editRecord.rsaEligibility || "",

        insuranceStatus: editRecord.insuranceStatus || "",

        insuranceName: editRecord.insuranceName || "",

        labourEstimate: editRecord.labourEstimate ?? "",

        partsEstimate: editRecord.partsEstimate ?? "",

        jobType: editRecord.jobType || "",

        promisedDeliveryDate: formatDateForInput(
          editRecord.promisedDeliveryDate,
        ),

        presentStatus:
          editRecord.presentStatus?._id || editRecord.presentStatus || "",

        labourBillAmount: editRecord.labourBillAmount ?? "",

        partsBillAmount: editRecord.partsBillAmount ?? "",

        labourBillAmountWithGst:
          editRecord.labourBillAmountWithGst ?? "",

        partsBillAmountWithGst:
          editRecord.partsBillAmountWithGst ?? "",

        depreciationAmount:
          editRecord.depreciationAmount ?? "",

        billDate: formatDateForInput(editRecord.billDate),

        voiceToCustomer: editRecord.voiceToCustomer || "",
        bodyshopRemarks: editRecord.bodyshopRemarks || "",
      });
    } else {
      const assignedBranches =
        user?.branches?.length > 0
          ? user.branches
          : user?.branch
            ? [user.branch]
            : [];

      setForm({
        ...initialForm,
        branch:
          user?.role === "admin"
            ? ""
            : assignedBranches[0]?._id || assignedBranches[0] || "",
      });
    }
  }, [editRecord, isOpen]);

  const formatDateForInput = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toISOString().split("T")[0];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,

      [name]: value,
    }));
  };

  const createEmptyQ1 = () => ({
    items: Array.from({ length: 16 }, (_, index) => ({
      code: index + 1,
      result: "",
      recheck: "",
    })),
    techNames: {
      denting: "",
      migBrazingWelding: "",
      antiRustApplication: "",
      spotWelding: "",
      pullingMeasurement: "",
    },
    checkedBy: "",
    reviewedBy: "",
    approvedBy: "",
  });

  const createEmptyQ2 = () => ({
    items: Array.from({ length: 16 }, (_, index) => ({
      code: index + 1,
      result: "",
      recheck: "",
    })),
    techNames: {
      putty: "",
      primerSurfacer: "",
      masking: "",
      colourMatchingPainting: "",
      polishing: "",
    },
    checkedBy: "",
    reviewedBy: "",
    approvedBy: "",
  });

  const createEmptyQ3 = () => ({
    items: Array.from({ length: 41 }, (_, index) => ({
      code: index + 1,
      result: "",
      recheck: "",
    })),

    remarks: "",
    recommendations: "",
    finalInspectorResult: "",
    reInspectionDate: "",

    checkedBy: "",
    reviewedBy: "",
    approvedBy: "",
  });

  const handleOpenQ1 = async () => {
    if (!editRecord?._id) {
      alert("Please save the main RO record before opening Q1.");
      return;
    }

    setActiveView("q1");
    setQ1Loading(true);
    setQ1Error("");

    try {
      const response = await api.get(
        `/forms/${editRecord._id}/inspections/q1`
      );

      setQ1Data(
        response.data.inspection
          ? {
            ...createEmptyQ1(),
            ...response.data.inspection,
            techNames: {
              ...createEmptyQ1().techNames,
              ...response.data.inspection.techNames,
            },
          }
          : createEmptyQ1()
      );
    } catch (error) {
      setQ1Error(
        error.response?.data?.message || "Failed to load Q1 form"
      );
    } finally {
      setQ1Loading(false);
    }
  };

  const handleSaveQ1 = async () => {
    if (!editRecord?._id || !q1Data) return;

    setQ1Saving(true);
    setQ1Error("");

    try {
      await api.put(
        `/forms/${editRecord._id}/inspections/q1`,
        q1Data
      );

      alert("Q1 inspection saved successfully.");
    } catch (error) {
      setQ1Error(
        error.response?.data?.message || "Failed to save Q1 form"
      );
    } finally {
      setQ1Saving(false);
    }
  };

  const handleOpenQ2 = async () => {
    if (!editRecord?._id) {
      alert("Please save the main RO record before opening Q2.");
      return;
    }

    setActiveView("q2");
    setQ2Loading(true);
    setQ2Error("");

    try {
      const response = await api.get(
        `/forms/${editRecord._id}/inspections/q2`
      );

      const empty = createEmptyQ2();
      const saved = response.data.inspection;

      setQ2Data(
        saved
          ? {
            ...empty,
            ...saved,
            techNames: {
              ...empty.techNames,
              ...saved.techNames,
            },
          }
          : empty
      );
    } catch (error) {
      setQ2Error(
        error.response?.data?.message || "Failed to load Q2 form"
      );
    } finally {
      setQ2Loading(false);
    }
  };

  const handleSaveQ2 = async () => {
    if (!editRecord?._id || !q2Data) return;

    setQ2Saving(true);
    setQ2Error("");

    try {
      await api.put(
        `/forms/${editRecord._id}/inspections/q2`,
        q2Data
      );

      alert("Q2 inspection saved successfully.");
    } catch (error) {
      setQ2Error(
        error.response?.data?.message || "Failed to save Q2 form"
      );
    } finally {
      setQ2Saving(false);
    }
  };

  const handleOpenQ3 = async () => {
    if (!editRecord?._id) {
      alert("Please save the main RO record before opening Q3.");
      return;
    }

    setActiveView("q3");
    setQ3Loading(true);
    setQ3Error("");

    try {
      const response = await api.get(
        `/forms/${editRecord._id}/inspections/q3`
      );

      const empty = createEmptyQ3();
      const saved = response.data.inspection;

      setQ3Data(
        saved
          ? {
            ...empty,
            ...saved,
            items: empty.items.map((defaultItem) => {
              const savedItem = saved.items?.find(
                (item) => item.code === defaultItem.code
              );

              return savedItem
                ? { ...defaultItem, ...savedItem }
                : defaultItem;
            }),
          }
          : empty
      );
    } catch (error) {
      setQ3Error(
        error.response?.data?.message || "Failed to load Q3 form"
      );
    } finally {
      setQ3Loading(false);
    }
  };

  const handleSaveQ3 = async () => {
    if (!editRecord?._id || !q3Data) return;

    setQ3Saving(true);
    setQ3Error("");

    try {
      await api.put(
        `/forms/${editRecord._id}/inspections/q3`,
        q3Data
      );

      alert("Q3 inspection saved successfully.");
    } catch (error) {
      setQ3Error(
        error.response?.data?.message || "Failed to save Q3 form"
      );
    } finally {
      setQ3Saving(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const payload = {
        ...form,

        labourEstimate:
          form.labourEstimate === ""
            ? undefined
            : Number(form.labourEstimate),

        partsEstimate:
          form.partsEstimate === ""
            ? undefined
            : Number(form.partsEstimate),

        labourBillAmount:
          form.labourBillAmount === ""
            ? undefined
            : Number(form.labourBillAmount),

        partsBillAmount:
          form.partsBillAmount === ""
            ? undefined
            : Number(form.partsBillAmount),

        labourBillAmountWithGst:
          form.labourBillAmountWithGst === ""
            ? undefined
            : Number(form.labourBillAmountWithGst),

        partsBillAmountWithGst:
          form.partsBillAmountWithGst === ""
            ? undefined
            : Number(form.partsBillAmountWithGst),

        depreciationAmount:
          form.depreciationAmount === ""
            ? undefined
            : Number(form.depreciationAmount),
      };

      // Save or update the record first
      if (isEditMode) {
        await updateFormRecord(editRecord._id, payload);
      } else {
        await createFormRecord(payload);
      }

      // Prepare WhatsApp message
      const roNumber = form.roNumber?.trim() || "-";
      const regNo = form.regNo?.trim() || "-";
      const voiceMessage = form.voiceToCustomer?.trim() || "";

      const whatsappMessage = [
        `RO Number: ${roNumber}`,
        `Registration Number: ${regNo}`,
        "",
        "Voice to Customer:",
        voiceMessage,
      ].join("\n");

      // Ask whether to open WhatsApp
      const sendWhatsApp = window.confirm(
        "Record saved successfully. Open WhatsApp to send Voice to Customer?"
      );

      if (sendWhatsApp) {
        const whatsappUrl =
          `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

        window.open(whatsappUrl, "_blank");
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to save record"
      );
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) {
    return null;
  }

  const handleViewHistory = async () => {
    if (activeView === "history") {
      setActiveView("record");
      return;
    }

    if (!editRecord?._id) return;

    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await api.get(`/forms/${editRecord._id}/history`);

      setRecordHistory(response.data.history || []);
    } catch (error) {
      setHistoryError(
        error.response?.data?.message || "Failed to load record history",
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatHistoryValue = (field, value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    if (field === "promisedDeliveryDate") {
      const date = new Date(`${value}T00:00:00`);

      return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString("en-IN");
    }

    if (field === "labourEstimate" || field === "partsEstimate") {
      return `₹${Number(value).toLocaleString("en-IN")}`;
    }

    return String(value);
  };

  return (
    <div
      className="bs-form-modal-overlay"
    // onMouseDown={(e) => {
    //   if (e.target.classList.contains("bs-form-modal-overlay")) {
    //     onClose();
    //   }
    // }}
    >
      <div className="bs-form-modal">
        {/* HEADER */}

        <div className="bs-form-modal-header">
          <div>
            <h2 className="bs-form-modal-title">
              {isEditMode ? "Edit Record" : "Create New Record"}
            </h2>

            <p className="bs-form-modal-subtitle">
              {isEditMode
                ? "Update body shop record"
                : "Add a new body shop record"}
            </p>
          </div>

          <div className="bs-form-modal-nav">
            {isEditMode && (
              <>
                <button
                  type="button"
                  className={`bs-form-modal-history-button ${activeView === "history" ? "active" : ""
                    }`}
                  onClick={() => {
                    setActiveView("history");
                    handleViewHistory();
                  }}
                >
                  History
                </button>

                {["q1", "q2", "q3"].map((type) => (
                  <button
                    key={type}
                    type="button"

                    className={`bs-form-modal-history-button ${activeView === type ? "active" : ""
                      }`}
                    onClick={
                      type === "q1"
                        ? handleOpenQ1
                        : type === "q2"
                          ? handleOpenQ2
                          : type === "q3"
                            ? handleOpenQ3
                            : undefined
                    }
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </>
            )}

            <button
              type="button"
              className="bs-form-modal-close"
              onClick={backToRecord}
            >
              ×
            </button>
          </div>
        </div>

        {/* ERROR */}

        {error && <div className="bs-form-modal-error">{error}</div>}

        {activeView === "history" ? (
          <div className="bs-form-modal-history">
            <h3>Record History</h3>

            {historyLoading && (
              <div className="bs-form-modal-history-message">
                Loading history...
              </div>
            )}

            {historyError && (
              <div className="bs-form-modal-error">{historyError}</div>
            )}

            {!historyLoading && !historyError && recordHistory.length === 0 && (
              <div className="bs-form-modal-history-message">
                No history available.
              </div>
            )}

            {!historyLoading && !historyError && recordHistory.length > 0 && (
              <div className="bs-form-modal-history-table-wrapper">
                <table className="bs-form-modal-history-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Action</th>
                      <th>Old Value</th>
                      <th>New Value</th>
                      <th>Changed By</th>
                      <th>Date & Time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recordHistory.map((entry) => (
                      <tr key={entry._id}>
                        <td>
                          {{
                            presentStatus: "Present Status",
                            promisedDeliveryDate: "Promise Delivery Date",
                            labourEstimate: "Labour Estimate",
                            partsEstimate: "Parts Estimate",
                          }[entry.field] || entry.field}
                        </td>

                        <td>{entry.action}</td>

                        <td>
                          {formatHistoryValue(entry.field, entry.oldValue)}
                        </td>

                        <td>
                          {formatHistoryValue(entry.field, entry.newValue)}
                        </td>

                        <td>
                          {entry.changedBy?.name || "Unknown"}
                          {entry.changedBy?.role
                            ? ` (${entry.changedBy.role})`
                            : ""}
                        </td>

                        <td>
                          {new Date(entry.createdAt).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeView === "q1" ? (
          <div className="bs-q1-container">
            {q1Loading ? (
              <div className="bs-form-modal-loading">
                Loading Q1 inspection...
              </div>
            ) : (
              <>
                {q1Error && (
                  <div className="bs-form-modal-error">{q1Error}</div>
                )}

                <div className="bs-q1-main-details">
                  {[
                    ["RO Number", form.roNumber],
                    ["Registration No.", form.regNo],
                    ["RO Date", form.roDate],
                    ["Model", form.model],
                    ["Job Type", form.jobType],
                  ].map(([label, value]) => (
                    <div className="bs-form-modal-field" key={label}>
                      <label>{label}</label>
                      <input value={value || "—"} readOnly />
                    </div>
                  ))}
                </div>

                {q1Data && (
                  <div className="bs-q1-content">
                    <div className="bs-q1-categories-grid">
                      {q1Categories.map((category) => (
                        <section className="bs-q1-category" key={category.key}>
                          <h3>{category.title}</h3>

                          <div className="bs-q1-tech-field">
                            <label>Tech. Name</label>
                            <input
                              type="text"
                              value={q1Data.techNames?.[category.key] || ""}
                              onChange={(e) =>
                                setQ1Data((prev) => ({
                                  ...prev,
                                  techNames: {
                                    ...prev.techNames,
                                    [category.key]: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Enter technician name"
                            />
                          </div>

                          <div className="bs-q1-table-wrapper">
                            <table className="bs-q1-table">
                              <thead>
                                <tr>
                                  <th>Code</th>
                                  <th>Inspection Items</th>
                                  <th>Standard</th>
                                  <th>Checking Method</th>
                                  <th>Result</th>
                                  <th>Re-check</th>
                                </tr>
                              </thead>

                              <tbody>
                                {category.codes.map((code) => {
                                  const inspection = q1InspectionItems.find(
                                    (entry) => entry.code === code
                                  );

                                  const item = q1Data.items.find(
                                    (entry) => entry.code === code
                                  );

                                  return (
                                    <tr key={code}>
                                      <td>{code}</td>

                                      <td>{inspection?.item}</td>

                                      <td>{inspection?.standard}</td>

                                      <td>{inspection?.method}</td>

                                      {["result", "recheck"].map((field) => (
                                        <td key={field}>
                                          <select
                                            value={item?.[field] || ""}
                                            onChange={(e) =>
                                              setQ1Data((prev) => ({
                                                ...prev,
                                                items: prev.items.map((entry) =>
                                                  entry.code === code
                                                    ? {
                                                      ...entry,
                                                      [field]: e.target.value,
                                                    }
                                                    : entry
                                                ),
                                              }))
                                            }
                                          >
                                            <option value="">Select</option>

                                            {q1Options.map((option) => (
                                              <option key={option} value={option}>
                                                {option}
                                              </option>
                                            ))}
                                          </select>
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      ))}
                    </div>


                    <div className="bs-q1-approval">
                      {[
                        ["checkedBy", "Checked By"],
                        ["reviewedBy", "Reviewed By"],
                        ["approvedBy", "Approved By"],
                      ].map(([field, label]) => (
                        <div className="bs-form-modal-field" key={field}>
                          <label>{label}</label>
                          <input
                            value={q1Data[field] || ""}
                            onChange={(e) =>
                              setQ1Data((prev) => ({
                                ...prev,
                                [field]: e.target.value,
                              }))
                            }
                            placeholder={`Enter ${label}`}
                          />
                        </div>
                      ))}
                    </div>

                  </div>
                )}

                <div className="bs-form-modal-actions">
                  <button
                    type="button"
                    className="bs-form-modal-cancel"
                    onClick={() => setActiveView("record")}
                  >
                    Back to Record
                  </button>

                  <button
                    type="button"
                    className="bs-form-modal-submit"
                    onClick={handleSaveQ1}
                    disabled={q1Saving || q1Loading || !q1Data}
                  >
                    {q1Saving ? "Saving..." : "Save Q1"}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : activeView === "q2" ? (
          <div className="bs-q1-container">
            {q2Loading ? (
              <div className="bs-form-modal-loading">
                Loading Q2 inspection...
              </div>
            ) : (
              <>
                {q2Error && (
                  <div className="bs-form-modal-error">{q2Error}</div>
                )}

                <div className="bs-q1-main-details">
                  {[
                    ["RO Number", form.roNumber],
                    ["Registration No.", form.regNo],
                    ["RO Date", form.roDate],
                    ["Model", form.model],
                    ["Job Type", form.jobType],
                  ].map(([label, value]) => (
                    <div className="bs-form-modal-field" key={label}>
                      <label>{label}</label>
                      <input value={value || "—"} readOnly />
                    </div>
                  ))}
                </div>

                {q2Data && (
                  <div className="bs-q1-content">
                    <div className="bs-q1-categories-grid">
                      {q2Categories.map((category) => (
                        <section
                          className="bs-q1-category"
                          key={category.key}
                        >
                          <h3>{category.title}</h3>

                          <div className="bs-q1-tech-field">
                            <label>Tech. Name</label>
                            <input
                              value={q2Data.techNames?.[category.key] || ""}
                              placeholder="Enter technician name"
                              onChange={(e) =>
                                setQ2Data((prev) => ({
                                  ...prev,
                                  techNames: {
                                    ...prev.techNames,
                                    [category.key]: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>

                          <div className="bs-q1-table-wrapper">
                            <table className="bs-q1-table">
                              <thead>
                                <tr>
                                  <th>Code</th>
                                  <th>Inspection Items</th>
                                  <th>Standard</th>
                                  <th>Checking Method</th>
                                  <th>Result</th>
                                  <th>Re-check</th>
                                </tr>
                              </thead>

                              <tbody>
                                {category.codes.map((code) => {
                                  const inspection = q2InspectionItems.find(
                                    (entry) => entry.code === code
                                  );

                                  const item = q2Data.items.find(
                                    (entry) => entry.code === code
                                  );

                                  return (
                                    <tr key={code}>
                                      <td>{code}</td>
                                      <td>{inspection?.item}</td>
                                      <td>{inspection?.standard}</td>
                                      <td>{inspection?.method}</td>

                                      {["result", "recheck"].map((field) => (
                                        <td key={field}>
                                          <select
                                            value={item?.[field] || ""}
                                            onChange={(e) =>
                                              setQ2Data((prev) => ({
                                                ...prev,
                                                items: prev.items.map((entry) =>
                                                  entry.code === code
                                                    ? {
                                                      ...entry,
                                                      [field]: e.target.value,
                                                    }
                                                    : entry
                                                ),
                                              }))
                                            }
                                          >
                                            <option value="">Select</option>
                                            {q1Options.map((option) => (
                                              <option
                                                key={option}
                                                value={option}
                                              >
                                                {option}
                                              </option>
                                            ))}
                                          </select>
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      ))}
                    </div>

                    <div className="bs-q1-approval">
                      {[
                        ["checkedBy", "Checked By"],
                        ["reviewedBy", "Reviewed By"],
                        ["approvedBy", "Approved By"],
                      ].map(([field, label]) => (
                        <div className="bs-form-modal-field" key={field}>
                          <label>{label}</label>
                          <input
                            value={q2Data[field] || ""}
                            placeholder={`Enter ${label}`}
                            onChange={(e) =>
                              setQ2Data((prev) => ({
                                ...prev,
                                [field]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bs-form-modal-actions">
                  <button
                    type="button"
                    className="bs-form-modal-cancel"
                    onClick={() => setActiveView("record")}
                  >
                    Back to Record
                  </button>

                  <button
                    type="button"
                    className="bs-form-modal-submit"
                    onClick={handleSaveQ2}
                    disabled={q2Saving || q2Loading || !q2Data}
                  >
                    {q2Saving ? "Saving..." : "Save Q2"}
                  </button>
                </div>
              </>
            )}
          </div>

        ) : activeView === "q3" ? (
          <div className="bs-q1-container">
            {q3Loading ? (
              <div className="bs-form-modal-loading">
                Loading Q3 inspection...
              </div>
            ) : (
              <>
                {q3Error && (
                  <div className="bs-form-modal-error">{q3Error}</div>
                )}

                <div className="bs-q1-main-details">
                  {[
                    ["RO Number", form.roNumber],
                    ["Registration No.", form.regNo],
                    ["RO Date", form.roDate],
                    ["Model", form.model],
                    ["Job Type", form.jobType],
                  ].map(([label, value]) => (
                    <div className="bs-form-modal-field" key={label}>
                      <label>{label}</label>
                      <input value={value || "—"} readOnly />
                    </div>
                  ))}
                </div>

                {q3Data && (
                  <div className="bs-q1-content">
                    <div className="bs-q1-categories-grid">
                      {q3Categories.map((category) => (
                        <section className="bs-q1-category" key={category.key}>
                          <h3>{category.title}</h3>

                          <div className="bs-q1-table-wrapper">
                            <table className="bs-q1-table">
                              <thead>
                                <tr>
                                  <th>Code</th>
                                  <th>Inspection Items</th>
                                  <th>Result</th>
                                  <th>Re-check</th>
                                </tr>
                              </thead>

                              <tbody>
                                {category.codes.map((code) => {
                                  const inspection = q3InspectionItems.find(
                                    (entry) => entry.code === code
                                  );

                                  const item = q3Data.items.find(
                                    (entry) => entry.code === code
                                  );

                                  return (
                                    <tr key={code}>
                                      <td>{code}</td>
                                      <td>{inspection?.item}</td>

                                      {["result", "recheck"].map((field) => (
                                        <td key={field}>
                                          <select
                                            value={item?.[field] || ""}
                                            onChange={(e) =>
                                              setQ3Data((prev) => ({
                                                ...prev,
                                                items: prev.items.map((entry) =>
                                                  entry.code === code
                                                    ? {
                                                      ...entry,
                                                      [field]: e.target.value,
                                                    }
                                                    : entry
                                                ),
                                              }))
                                            }
                                          >
                                            <option value="">Select</option>

                                            {q3Options.map((option) => (
                                              <option key={option} value={option}>
                                                {option}
                                              </option>
                                            ))}
                                          </select>
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      ))}
                    </div>

                    <div className="bs-q1-approval">
                      <div className="bs-form-modal-field">
                        <label>Remarks</label>
                        <textarea
                          rows={3}
                          value={q3Data.remarks || ""}
                          onChange={(e) =>
                            setQ3Data((prev) => ({
                              ...prev,
                              remarks: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="bs-form-modal-field">
                        <label>Recommendations</label>
                        <textarea
                          rows={3}
                          value={q3Data.recommendations || ""}
                          onChange={(e) =>
                            setQ3Data((prev) => ({
                              ...prev,
                              recommendations: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="bs-form-modal-field">
                        <label>Final Inspector Result</label>
                        <select
                          value={q3Data.finalInspectorResult || ""}
                          onChange={(e) =>
                            setQ3Data((prev) => ({
                              ...prev,
                              finalInspectorResult: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select result</option>
                          <option value="OK">OK</option>
                          <option value="Not OK">Not OK</option>
                        </select>
                      </div>

                      <div className="bs-form-modal-field">
                        <label>Re-Inspection Date</label>
                        <input
                          type="date"
                          value={q3Data.reInspectionDate || ""}
                          onChange={(e) =>
                            setQ3Data((prev) => ({
                              ...prev,
                              reInspectionDate: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {[
                        ["checkedBy", "Checked By"],
                        ["reviewedBy", "Reviewed By"],
                        ["approvedBy", "Approved By"],
                      ].map(([field, label]) => (
                        <div className="bs-form-modal-field" key={field}>
                          <label>{label}</label>
                          <input
                            value={q3Data[field] || ""}
                            placeholder={`Enter ${label}`}
                            onChange={(e) =>
                              setQ3Data((prev) => ({
                                ...prev,
                                [field]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bs-form-modal-actions">
                  <button
                    type="button"
                    className="bs-form-modal-cancel"
                    onClick={() => setActiveView("record")}
                  >
                    Back to Record
                  </button>

                  <button
                    type="button"
                    className="bs-form-modal-submit"
                    onClick={handleSaveQ3}
                    disabled={q3Saving || q3Loading || !q3Data}
                  >
                    {q3Saving ? "Saving..." : "Save Q3"}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : loadingData ? (


          <div className="bs-form-modal-loading">
            <img
              src="/loading.png"
              alt="Loading..."
              className="bs-loading-spinner"
            />
            {/* <p>Loading form...</p> */}
          </div>
        ) : (
          <>
            <form
              id="bs-form-modal-form"
              className="bs-form-modal-form"
              onSubmit={handleSubmit}
            >
              <div className="bs-form-modal-fields-grid">
                <div className="bs-form-modal-field">
                  <label htmlFor="bs-branch">
                    Branch <span className="bs-form-modal-required">*</span>
                  </label>

                  <select
                    id="bs-branch"
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select branch</option>

                    {branches.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} {item.code ? `(${item.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-regNo">
                    Registration Number{" "}
                    <span className="bs-form-modal-required">*</span>
                  </label>
                  <input
                    id="bs-regNo"
                    type="text"
                    name="regNo"
                    value={form.regNo}
                    onChange={handleChange}
                    placeholder="KL10AX6753"
                    required
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-yardEntryDate">
                    Yard Entry Date{" "}
                    <span className="bs-form-modal-required">*</span>
                  </label>
                  <input
                    id="bs-yardEntryDate"
                    type="date"
                    name="yardEntryDate"
                    value={form.yardEntryDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-roDate">RO Date</label>
                  <input
                    id="bs-roDate"
                    type="date"
                    name="roDate"
                    value={form.roDate}
                    onChange={handleChange}
                  />
                </div>


                <div className="bs-form-modal-field">
                  <label>RO Aging</label>
                  <div className="bs-ro-aging-tile">
                    {calculateRoAging(form.roDate) === null
                      ? "—"
                      : `${calculateRoAging(form.roDate)} days`}
                  </div>
                </div>


                <div className="bs-form-modal-field">
                  <label htmlFor="bs-roNumber">RO Number</label>
                  <input
                    id="bs-roNumber"
                    type="text"
                    name="roNumber"
                    value={form.roNumber}
                    onChange={handleChange}
                    placeholder="Enter RO number"
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label>
                    Model
                    <select
                      name="model"
                      value={form.model || ""}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select model</option>

                      {vehicleModels.map((vehicleModel) => (
                        <option
                          key={vehicleModel._id}
                          value={vehicleModel.name}
                        >
                          {vehicleModel.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-jobType">Job Type</label>
                  <select
                    id="bs-jobType"
                    name="jobType"
                    value={form.jobType}
                    onChange={handleChange}
                  >
                    <option value="">Select job type</option>
                    <option value="M1">M1</option>
                    <option value="M2">M2</option>
                    <option value="M3">M3</option>
                    <option value="M4">M4</option>
                  </select>
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-presentStatus">Status</label>
                  <select
                    id="bs-presentStatus"
                    name="presentStatus"
                    value={form.presentStatus}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select status</option>
                    {statuses.map((status) => (
                      <option key={status._id} value={status._id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-customerName">Customer</label>
                  <input
                    id="bs-customerName"
                    type="text"
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    placeholder="Customer name"
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-contactNo">Contact</label>
                  <input
                    id="bs-contactNo"
                    type="tel"
                    name="contactNo"
                    value={form.contactNo}
                    onChange={handleChange}
                    maxLength="10"
                    placeholder="10 digit number"
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-insuranceStatus">Insurance Status</label>
                  <select
                    id="bs-insuranceStatus"
                    name="insuranceStatus"
                    value={form.insuranceStatus}
                    onChange={handleChange}
                  >
                    <option value="">Select insurance status</option>
                    <option value="In-House">In-House</option>
                    <option value="Out-Side">Out-Side</option>
                    <option value="Cash">Cash</option>
                    <option value="Warranty">Warranty</option>
                  </select>
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-insuranceName">Insurance Name</label>
                  <select
                    id="bs-insuranceName"
                    name="insuranceName"
                    value={form.insuranceName || ""}
                    onChange={handleChange}
                  >
                    <option value="">Select insurance company</option>

                    {insuranceCompanies.map((company) => (
                      <option key={company._id} value={company.name}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-serviceAdvisor">Service Adviser</label>

                  <select
                    id="bs-serviceAdvisor"
                    name="serviceAdvisor"
                    value={form.serviceAdvisor || ""}
                    onChange={handleChange}
                  >
                    <option value="">Select service adviser</option>

                    {serviceAdvisors.map((advisor) => (
                      <option key={advisor._id} value={advisor.name}>
                        {advisor.name}
                      </option>
                    ))}

                    {form.serviceAdvisor &&
                      !serviceAdvisors.some(
                        (advisor) => advisor.name === form.serviceAdvisor,
                      ) && (
                        <option value={form.serviceAdvisor}>
                          {form.serviceAdvisor} (existing)
                        </option>
                      )}
                  </select>
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-nextPmsDate">PMS Date</label>
                  <input
                    id="bs-nextPmsDate"
                    type="date"
                    name="nextPmsDate"
                    value={form.nextPmsDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-rsaEligibility">RSA</label>
                  <select
                    id="bs-rsaEligibility"
                    name="rsaEligibility"
                    value={form.rsaEligibility}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Elig">Eligible</option>
                    <option value="Not Elig">Not Eligible</option>
                    <option value="Live">Live</option>

                  </select>
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-shieldEligibility">Shield</label>
                  <select
                    id="bs-shieldEligibility"
                    name="shieldEligibility"
                    value={form.shieldEligibility}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Elig">Eligible</option>
                    <option value="Not Elig">Not Eligible</option>

                  </select>
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-whatsappGroupCreationDate">
                    WhatsApp Date
                  </label>
                  <input
                    id="bs-whatsappGroupCreationDate"
                    type="date"
                    name="whatsappGroupCreationDate"
                    value={form.whatsappGroupCreationDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-promisedDeliveryDate">
                    Promise Delivery Date
                  </label>
                  <input
                    id="bs-promisedDeliveryDate"
                    type="date"
                    name="promisedDeliveryDate"
                    value={form.promisedDeliveryDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-labourEstimate">Labour Estimate</label>
                  <input
                    id="bs-labourEstimate"
                    type="number"
                    min="0"
                    name="labourEstimate"
                    value={form.labourEstimate}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-partsEstimate">Parts Estimate</label>
                  <input
                    id="bs-partsEstimate"
                    type="number"
                    min="0"
                    name="partsEstimate"
                    value={form.partsEstimate}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-billDate">Bill Date</label>
                  <input
                    id="bs-billDate"
                    type="date"
                    name="billDate"
                    value={form.billDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-depreciationAmount">
                    Depreciation Amount
                  </label>
                  <input
                    id="bs-depreciationAmount"
                    type="number"
                    min="0"
                    name="depreciationAmount"
                    value={form.depreciationAmount}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>


                <div className="bs-form-modal-field">
                  <label htmlFor="bs-labourBillAmount">Labour Amount (Without GST)</label>
                  <input
                    id="bs-labourBillAmount"
                    type="number"
                    min="0"
                    name="labourBillAmount"
                    value={form.labourBillAmount}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
                <div className="bs-form-modal-field">
                  <label htmlFor="bs-labourBillAmountWithGst">
                    Labour Amount (With GST)
                  </label>
                  <input
                    id="bs-labourBillAmountWithGst"
                    type="number"
                    min="0"
                    name="labourBillAmountWithGst"
                    value={form.labourBillAmountWithGst}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-partsBillAmount">Parts Amount (Without GST)</label>
                  <input
                    id="bs-partsBillAmount"
                    type="number"
                    min="0"
                    name="partsBillAmount"
                    value={form.partsBillAmount}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
                <div className="bs-form-modal-field">
                  <label htmlFor="bs-partsBillAmountWithGst">
                    Parts Amount (With GST)
                  </label>
                  <input
                    id="bs-partsBillAmountWithGst"
                    type="number"
                    min="0"
                    name="partsBillAmountWithGst"
                    value={form.partsBillAmountWithGst}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>


                <div className="bs-form-modal-field bs-form-modal-textarea-field">
                  <label htmlFor="bs-voiceToCustomer">Voice to Customer</label>
                  <textarea
                    id="bs-voiceToCustomer"
                    name="voiceToCustomer"
                    value={form.voiceToCustomer}
                    onChange={handleChange}
                    placeholder="Enter voice to customer"
                    rows={4}
                  />
                </div>

                <div className="bs-form-modal-field bs-form-modal-textarea-field">
                  <label htmlFor="bs-bodyshopRemarks">Bodyshop Remarks</label>
                  <textarea
                    id="bs-bodyshopRemarks"
                    name="bodyshopRemarks"
                    value={form.bodyshopRemarks}
                    onChange={handleChange}
                    placeholder="Enter bodyshop remarks"
                    rows={4}
                  />
                </div>
              </div>
            </form>

            <div className="bs-form-modal-actions">
              <button
                type="button"
                className="bs-form-modal-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="bs-form-modal-form"
                className="bs-form-modal-submit"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : isEditMode
                    ? "Update Record"
                    : "Create Record"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FormModal;
