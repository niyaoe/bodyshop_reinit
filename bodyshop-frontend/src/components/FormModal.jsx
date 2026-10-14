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

  billDate: "",
};

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

  /*

   * Load branches and statuses

   */

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
            api.get("/service-advisors"),
          ]);

        setStatuses(statusData.statuses || statusData || []);

        setVehicleModels(modelData.data.vehicleModels || []);

        setInsuranceCompanies(insuranceData.data.insuranceCompanies || []);

        setServiceAdvisors(advisorData.data.serviceAdvisors || []);

        // Branches are required only for admin
        if (user?.role === "admin") {
          const branchData = await getBranches();
          setBranches(branchData.branches || branchData || []);
        }
      } catch (error) {
        setError(error.response?.data?.message || "Failed to load form data");
      } finally {
        setLoadingData(false);
      }
    };

    loadFormData();
  }, [isOpen, user?.role]);

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

        billDate: formatDateForInput(editRecord.billDate),
      });
    } else {
      setForm(initialForm);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      setError("");

      const payload = {
        ...form,

        labourEstimate:
          form.labourEstimate === "" ? undefined : Number(form.labourEstimate),

        partsEstimate:
          form.partsEstimate === "" ? undefined : Number(form.partsEstimate),

        labourBillAmount:
          form.labourBillAmount === ""
            ? undefined
            : Number(form.labourBillAmount),

        partsBillAmount:
          form.partsBillAmount === ""
            ? undefined
            : Number(form.partsBillAmount),
      };

      /*

       * User branch is controlled by backend.

       */

      if (user?.role !== "admin") {
        delete payload.branch;
      }

      if (isEditMode) {
        await updateFormRecord(editRecord._id, payload);
      } else {
        await createFormRecord(payload);
      }

      onSuccess?.();

      onClose();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save record");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const handleViewHistory = async () => {
    if (historyOpen) {
      setHistoryOpen(false);
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

          

          <div style={{display:"flex" , gap:"10px"}}>
            {isEditMode && user?.role === "admin" && (
            <button
              type="button"
              className="bs-form-modal-history-button"
              onClick={handleViewHistory}
            >
              {historyOpen ? "Back to Record" : "History"}
            </button>
          )}
          <button
            type="button"
            className="bs-form-modal-close"
            onClick={onClose}
          >
            ×
          </button>

          </div>

          
          
        </div>

        {/* ERROR */}

        {error && <div className="bs-form-modal-error">{error}</div>}

        {historyOpen ? (
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
                {user?.role === "admin" && (
                  <div className="bs-form-modal-field">
                    <label htmlFor="bs-branch">Branch</label>
                    <select
                      id="bs-branch"
                      name="branch"
                      value={form.branch}
                      onChange={handleChange}
                    >
                      <option value="">Select branch</option>
                      {branches.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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
                    placeholder="KL01AB1234"
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
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
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
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
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
                  <label htmlFor="bs-labourBillAmount">Labour Amount</label>
                  <input
                    id="bs-labourBillAmount"
                    type="number"
                    min="0"
                    name="labourBillAmount"
                    value={form.labourBillAmount}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>

                <div className="bs-form-modal-field">
                  <label htmlFor="bs-partsBillAmount">Parts Amount</label>
                  <input
                    id="bs-partsBillAmount"
                    type="number"
                    min="0"
                    name="partsBillAmount"
                    value={form.partsBillAmount}
                    onChange={handleChange}
                    placeholder="0.00"
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
