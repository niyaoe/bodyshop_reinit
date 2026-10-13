import { useEffect, useState } from "react";
import api from "../api/axios";
import "./ServiceAdvisorManagement.css";

const EMPTY_FORM = {
  name: "",
  branchId: "",
};

function ServiceAdvisorManagement() {
  const [advisors, setAdvisors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAdvisors = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/service-advisors?includeInactive=true");
      setAdvisors(response.data.serviceAdvisors || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load service advisers.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await api.get("/branches");
      setBranches(response.data.branches || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load branches.");
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchAdvisors();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEdit = (advisor) => {
    setEditingId(advisor._id);

    setForm({
      name: advisor.name || "",
      branchId: advisor.branch?._id || advisor.branch || "",
    });

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Service adviser name is required.");
      return;
    }

    if (!form.branchId) {
      setError("Please select a branch.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        branchId: form.branchId,
      };

      if (editingId) {
        await api.patch(`/service-advisors/${editingId}`, payload);
        setSuccess("Service adviser updated successfully.");
      } else {
        await api.post("/service-advisors", payload);
        setSuccess("Service adviser created successfully.");
      }

      resetForm();
      await fetchAdvisors();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save service adviser.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (advisor) => {
    const confirmed = window.confirm(
      `Deactivate ${advisor.name}? Existing records will remain unchanged.`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.patch(`/service-advisors/${advisor._id}`, {
        isActive: false,
      });

      setSuccess(`${advisor.name} deactivated successfully.`);
      await fetchAdvisors();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to deactivate service adviser.",
      );
    }
  };

  const handleActivate = async (advisor) => {
    setError("");
    setSuccess("");

    try {
      await api.patch(`/service-advisors/${advisor._id}`, {
        isActive: true,
      });

      setSuccess(`${advisor.name} activated successfully.`);
      await fetchAdvisors();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to activate service adviser.",
      );
    }
  };

  const getBranchName = (advisor) => {
    if (advisor.branch && typeof advisor.branch === "object") {
      return advisor.branch.name || "Unknown branch";
    }

    const branch = branches.find((item) => item._id === advisor.branch);

    return branch?.name || "Unknown branch";
  };

  return (
    <div className="bs-advisor-management">
      <div className="bs-advisor-heading">
        <div>
          <h3>Service Adviser Management</h3>
          <p>Manage service advisers assigned to each branch.</p>
        </div>

        <button
          type="button"
          className="bs-advisor-refresh"
          onClick={() => {
            fetchBranches();
            fetchAdvisors();
          }}
          disabled={loading}
          title="Refresh service advisers"
        >
          ↻
        </button>
      </div>

      {error && (
        <div className="bs-advisor-alert bs-advisor-alert-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div
          className="bs-advisor-alert bs-advisor-alert-success"
          role="status"
        >
          {success}
        </div>
      )}

      <section className="bs-advisor-form-section">
        <div className="bs-advisor-section-title">
          <div>
            <h4>
              {editingId ? "Edit service adviser" : "Add service adviser"}
            </h4>
            <p>
              {editingId
                ? "Update the name or assigned branch."
                : "Add a service adviser and assign a branch."}
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              className="bs-advisor-cancel"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel edit
            </button>
          )}
        </div>

        <form className="bs-advisor-form" onSubmit={handleSubmit}>
          <label>
            Service adviser name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Rahul"
              required
            />
          </label>

          <label>
            Branch
            <select
              name="branchId"
              value={form.branchId}
              onChange={handleChange}
              required
            >
              <option value="">Select branch</option>

              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}({branch.code})
                </option>
              ))}
            </select>
          </label>

          <div className="bs-advisor-form-actions">
            <button
              type="submit"
              className="bs-advisor-save"
              disabled={saving || branches.length === 0}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Add adviser"}
            </button>

            {editingId && (
              <button
                type="button"
                className="bs-advisor-cancel"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="bs-advisor-list-section">
        <div className="bs-advisor-list-heading">
          <div>
            <h4>Service advisers</h4>
            <p>
              {advisors.filter((advisor) => advisor.isActive !== false).length}{" "}
              active
              {" · "}
              {
                advisors.filter((advisor) => advisor.isActive === false).length
              }{" "}
              inactive
            </p>
          </div>
        </div>

        <div className="bs-advisor-table-wrap">
          {loading ? (
            <p className="bs-advisor-empty">Loading service advisers...</p>
          ) : advisors.length === 0 ? (
            <p className="bs-advisor-empty">No service advisers found.</p>
          ) : (
            <table className="bs-advisor-table">
              <thead>
                <tr>
                  <th>Service adviser</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {advisors.map((advisor) => (
                  <tr key={advisor._id}>
                    <td>
                      <strong>{advisor.name}</strong>
                    </td>

                    <td>{getBranchName(advisor)}</td>

                    <td>
                      <span
                        className={
                          advisor.isActive === false
                            ? "bs-advisor-status bs-advisor-status-inactive"
                            : "bs-advisor-status bs-advisor-status-active"
                        }
                      >
                        {advisor.isActive === false ? "Inactive" : "Active"}
                      </span>
                    </td>

                    <td>
                      <div className="bs-advisor-actions">
                        <button
                          type="button"
                          className="bs-advisor-edit"
                          onClick={() => handleEdit(advisor)}
                        >
                          Edit
                        </button>

                        {advisor.isActive === false ? (
                          <button
                            type="button"
                            className="bs-advisor-activate"
                            onClick={() => handleActivate(advisor)}
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="bs-advisor-deactivate"
                            onClick={() => handleDeactivate(advisor)}
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

export default ServiceAdvisorManagement;
