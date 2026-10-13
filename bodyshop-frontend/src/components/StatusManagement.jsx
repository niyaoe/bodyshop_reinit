import { useEffect, useState } from "react";
import api from "../api/axios";
import "./StatusManagement.css";

const SECTIONS = [
  { value: "open", label: "Open" },
  { value: "billed", label: "Billed" },
  { value: "legalLoss", label: "Legal Loss" },
];

const EMPTY_FORM = {
  name: "",
  section: "open",
  sortOrder: 0,
};

function StatusManagement() {
  const [statuses, setStatuses] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch active statuses from all three sections.
      const response = await api.get("/statuses");

      setStatuses(response.data.statuses || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load statuses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEdit = (status) => {
    setEditingId(status._id);
    setForm({
      name: status.name || "",
      section: status.section || "open",
      sortOrder: status.sortOrder ?? 0,
    });

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Status name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        section: form.section,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editingId) {
        await api.put(`/statuses/${editingId}`, payload);
        setSuccess("Status updated successfully.");
      } else {
        await api.post("/statuses", payload);
        setSuccess("Status created successfully.");
      }

      resetForm();
      await fetchStatuses();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to ${editingId ? "update" : "create"} status.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (status) => {
    const confirmed = window.confirm(
      `Deactivate "${status.name}"? It will no longer appear in the active status list.`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/statuses/${status._id}`);

      if (editingId === status._id) {
        resetForm();
      }

      setSuccess(`"${status.name}" was deactivated.`);
      await fetchStatuses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to deactivate status.");
    }
  };

  const getSectionLabel = (section) =>
    SECTIONS.find((item) => item.value === section)?.label || section;

  return (
    <div className="bs-status-management">
      <div className="bs-status-heading">
        <div>
          <h3>Status Management</h3>
          <p>Manage statuses used by your dashboard sections.</p>
        </div>

        <button
          type="button"
          className="bs-status-refresh"
          onClick={fetchStatuses}
          disabled={loading}
          title="Refresh statuses"
        >
          ↻
        </button>
      </div>

      {error && (
        <div className="bs-status-alert bs-status-alert-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="bs-status-alert bs-status-alert-success" role="status">
          {success}
        </div>
      )}

      <section className="bs-status-form-section">
        <div className="bs-status-section-heading">
          <div>
            <h4>{editingId ? "Edit status" : "Create status"}</h4>
            <p>
              {editingId
                ? "Update the status name, section, or order."
                : "Add a status to one of your dashboard sections."}
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              className="bs-status-cancel"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>

        <form className="bs-status-form" onSubmit={handleSubmit}>
          <label>
            Status Name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Waiting for approval"
              required
            />
          </label>

          <label>
            Dashboard Section
            <select
              name="section"
              value={form.section}
              onChange={handleChange}
              required
            >
              {SECTIONS.map((section) => (
                <option key={section.value} value={section.value}>
                  {section.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Display Order
            <input
              type="number"
              name="sortOrder"
              value={form.sortOrder}
              onChange={handleChange}
              step="1"
            />
          </label>

          <div className="bs-status-form-actions">
            <button type="submit" className="bs-status-save" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Create Status"}
            </button>

            {editingId && (
              <button
                type="button"
                className="bs-status-cancel"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="bs-status-list-section">
        <div className="bs-status-list-heading">
          <div>
            <h4>Existing Statuses</h4>
            <p>{statuses.length} active statuses</p>
          </div>
        </div>

        <div className="bs-status-table-wrap">
          {loading ? (
            <p className="bs-status-empty">Loading statuses...</p>
          ) : statuses.length === 0 ? (
            <p className="bs-status-empty">No active statuses found.</p>
          ) : (
            <table className="bs-status-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Section</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {statuses.map((status) => (
                  <tr key={status._id}>
                    <td>
                      <strong className="bs-status-name">{status.name}</strong>
                    </td>

                    <td>
                      <span
                        className={`bs-status-section-badge bs-status-section-${status.section}`}
                      >
                        {getSectionLabel(status.section)}
                      </span>
                    </td>

                    <td>{status.sortOrder ?? 0}</td>

                    <td>
                      <div className="bs-status-actions">
                        <button
                          type="button"
                          className="bs-status-edit"
                          onClick={() => handleEdit(status)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="bs-status-delete"
                          onClick={() => handleDeactivate(status)}
                        >
                          Deactivate
                        </button>
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

export default StatusManagement;
