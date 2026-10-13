
import { useEffect, useState } from "react";
import api from "../api/axios";
import "./InsuranceManagement.css";

const EMPTY_FORM = {
  name: "",
  sortOrder: 0,
};

function InsuranceManagement() {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCompanies = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/insurance-companies");
      setCompanies(response.data.insuranceCompanies || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load insurance companies.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
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

  const handleEdit = (company) => {
    setEditingId(company._id);
    setForm({
      name: company.name || "",
      sortOrder: company.sortOrder ?? 0,
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Insurance company name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editingId) {
        await api.put(`/insurance-companies/${editingId}`, payload);
        setSuccess("Insurance company updated successfully.");
      } else {
        await api.post("/insurance-companies", payload);
        setSuccess("Insurance company created successfully.");
      }

      resetForm();
      await fetchCompanies();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save insurance company.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (company) => {
    const confirmed = window.confirm(
      `Deactivate ${company.name}? Existing records will remain unchanged.`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/insurance-companies/${company._id}`);
      setSuccess(`${company.name} deactivated successfully.`);
      await fetchCompanies();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to deactivate insurance company.",
      );
    }
  };

  return (
    <div className="bs-insurance-management">
      <div className="bs-insurance-heading">
        <div>
          <h3>Insurance Management</h3>
          <p>Manage insurance companies available in the tracker.</p>
        </div>

        <button
          type="button"
          className="bs-insurance-refresh"
          onClick={fetchCompanies}
          disabled={loading}
          title="Refresh insurance companies"
        >
          ↻
        </button>
      </div>

      {error && (
        <div className="bs-insurance-alert bs-insurance-alert-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div
          className="bs-insurance-alert bs-insurance-alert-success"
          role="status"
        >
          {success}
        </div>
      )}

      <section className="bs-insurance-form-section">
        <div className="bs-insurance-section-title">
          <div>
            <h4>{editingId ? "Edit insurance company" : "Add insurance company"}</h4>
            <p>
              {editingId
                ? "Update the selected insurance company."
                : "Add an insurance company to the available list."}
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              className="bs-insurance-cancel"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel edit
            </button>
          )}
        </div>

        <form className="bs-insurance-form" onSubmit={handleSubmit}>
          <label>
            Insurance company name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. ICICI Lombard"
              required
            />
          </label>

          <label>
            Sort order
            <input
              type="number"
              name="sortOrder"
              value={form.sortOrder}
              onChange={handleChange}
            />
          </label>

          <div className="bs-insurance-form-actions">
            <button
              type="submit"
              className="bs-insurance-save"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Add company"}
            </button>

            {editingId && (
              <button
                type="button"
                className="bs-insurance-cancel"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="bs-insurance-list-section">
        <div className="bs-insurance-list-heading">
          <div>
            <h4>Insurance companies</h4>
            <p>{companies.length} active companies</p>
          </div>
        </div>

        <div className="bs-insurance-table-wrap">
          {loading ? (
            <p className="bs-insurance-empty">Loading insurance companies...</p>
          ) : companies.length === 0 ? (
            <p className="bs-insurance-empty">No insurance companies found.</p>
          ) : (
            <table className="bs-insurance-table">
              <thead>
                <tr>
                  <th>Insurance company</th>
                  <th>Sort order</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {companies.map((company) => (
                  <tr key={company._id}>
                    <td>
                      <strong>{company.name}</strong>
                    </td>
                    <td>{company.sortOrder ?? 0}</td>
                    <td>
                      <div className="bs-insurance-actions">
                        <button
                          type="button"
                          className="bs-insurance-edit"
                          onClick={() => handleEdit(company)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="bs-insurance-deactivate"
                          onClick={() => handleDeactivate(company)}
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

export default InsuranceManagement;
