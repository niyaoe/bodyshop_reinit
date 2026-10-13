
import { useEffect, useState } from "react";
import api from "../api/axios";
import "./ModelManagement.css";

const EMPTY_FORM = {
  name: "",
  subSegmentName: "",
  sortOrder: 0,
};

function ModelManagement() {
  const [models, setModels] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchModels = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/vehicle-models");
      setModels(response.data.vehicleModels || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load vehicle models."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
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

  const handleEdit = (model) => {
    setEditingId(model._id);
    setForm({
      name: model.name || "",
      subSegmentName: model.subSegmentName || "",
      sortOrder: model.sortOrder ?? 0,
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Vehicle model name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        subSegmentName: form.subSegmentName.trim(),
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editingId) {
        await api.put(`/vehicle-models/${editingId}`, payload);
        setSuccess("Vehicle model updated successfully.");
      } else {
        await api.post("/vehicle-models", payload);
        setSuccess("Vehicle model created successfully.");
      }

      resetForm();
      await fetchModels();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save vehicle model."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (model) => {
    const confirmed = window.confirm(
      `Deactivate ${model.name}? Existing records will remain unchanged.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/vehicle-models/${model._id}`);
      setSuccess(`${model.name} deactivated successfully.`);
      await fetchModels();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to deactivate vehicle model."
      );
    }
  };

  return (
    <div className="bs-model-management">
      <div className="bs-model-heading">
        <div>
          <h3>Model Management</h3>
          <p>Manage vehicle models available in the tracker.</p>
        </div>

        <button
          type="button"
          className="bs-model-refresh"
          onClick={fetchModels}
          disabled={loading}
          title="Refresh models"
        >
          ↻
        </button>
      </div>

      {error && (
        <div className="bs-model-alert bs-model-alert-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="bs-model-alert bs-model-alert-success" role="status">
          {success}
        </div>
      )}

      <section className="bs-model-form-section">
        <div className="bs-model-section-title">
          <div>
            <h4>{editingId ? "Edit model" : "Add vehicle model"}</h4>
            <p>
              {editingId
                ? "Update the selected vehicle model."
                : "Add a model to the available vehicle list."}
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              className="bs-model-cancel"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel edit
            </button>
          )}
        </div>

        <form className="bs-model-form" onSubmit={handleSubmit}>
          <label>
            Model name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. SCORPIO-CLASSIC"
              required
            />
          </label>

          <label>
            Sub Segment Name
            <input
              type="text"
              name="subSegmentName"
              value={form.subSegmentName}
              onChange={handleChange}
              placeholder="e.g. PV"
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

          <div className="bs-model-form-actions">
            <button
              type="submit"
              className="bs-model-save"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Add model"}
            </button>

            {editingId && (
              <button
                type="button"
                className="bs-model-cancel"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="bs-model-list-section">
        <div className="bs-model-list-heading">
          <div>
            <h4>Vehicle models</h4>
            <p>{models.length} active models</p>
          </div>
        </div>

        <div className="bs-model-table-wrap">
          {loading ? (
            <p className="bs-model-empty">Loading models...</p>
          ) : models.length === 0 ? (
            <p className="bs-model-empty">No vehicle models found.</p>
          ) : (
            <table className="bs-model-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Sub Segment Name</th>
                  <th>Sort order</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {models.map((model) => (
                  <tr key={model._id}>
                    <td>
                      <strong>{model.name}</strong>
                    </td>
                    <td>{model.subSegmentName || "—"}</td>
                    <td>{model.sortOrder ?? 0}</td>
                    <td>
                      <div className="bs-model-actions">
                        <button
                          type="button"
                          className="bs-model-edit"
                          onClick={() => handleEdit(model)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="bs-model-deactivate"
                          onClick={() => handleDeactivate(model)}
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

export default ModelManagement;
