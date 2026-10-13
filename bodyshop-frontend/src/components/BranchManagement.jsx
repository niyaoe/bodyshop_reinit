import { useEffect, useState } from "react";
import api from "../api/axios";
import "./BranchManagement.css";

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/branches");
      const data = response.data;

      setBranches(
        Array.isArray(data)
          ? data
          : Array.isArray(data.branches)
            ? data.branches
            : [],
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load branches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm({ name: "", code: "" });
    setEditingId(null);
  };

  const handleEdit = (branch) => {
    setEditingId(branch._id);
    setForm({
      name: branch.name || "",
      code: branch.code || "",
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.code.trim()) {
      setError("Branch name and code are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
      };

      if (editingId) {
        await api.put(`/branches/${editingId}`, payload);
      } else {
        await api.post("/branches", payload);
      }

      resetForm();
      await fetchBranches();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to ${editingId ? "update" : "create"} branch.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branch) => {
    const confirmed = window.confirm(`Delete branch "${branch.name}"?`);

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/branches/${branch._id}`);

      if (editingId === branch._id) {
        resetForm();
      }

      await fetchBranches();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete branch.");
    }
  };

  return (
    <div className="bs-branch-management">
      <div className="bs-branch-heading">
        <div>
          <h3>Branch Management</h3>
          <p>Create and manage workshop branches.</p>
        </div>

        <button
          type="button"
          className="bs-branch-refresh"
          onClick={fetchBranches}
          disabled={loading}
          title="Refresh branches"
        >
          ↻
        </button>
      </div>

      {error && (
        <div className="bs-branch-error" role="alert">
          {error}
        </div>
      )}

      <form className="bs-branch-form" onSubmit={handleSubmit}>
        <label>
          Branch Name
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Calicut"
            required
          />
        </label>

        <label>
          Branch Code
          <input
            type="text"
            name="code"
            value={form.code}
            onChange={handleChange}
            placeholder="e.g. CLT"
            required
          />
        </label>

        <div className="bs-branch-form-actions">
          <button type="submit" className="bs-branch-save" disabled={saving}>
            {saving
              ? "Saving..."
              : editingId
                ? "Update Branch"
                : "Create Branch"}
          </button>

          {editingId && (
            <button
              type="button"
              className="bs-branch-cancel"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bs-branch-list-heading">
        <h4>Existing Branches</h4>
        <span>{branches.length}</span>
      </div>

      {loading ? (
        <p className="bs-branch-message">Loading branches...</p>
      ) : branches.length === 0 ? (
        <p className="bs-branch-message">No branches found.</p>
      ) : (
        <div className="bs-branch-list">
          {branches.map((branch) => (
            <div className="bs-branch-item" key={branch._id}>
              <div className="bs-branch-info">
                <strong>{branch.name}</strong>
                <span>{branch.code}</span>
              </div>

              <div className="bs-branch-item-actions">
                <button
                  type="button"
                  onClick={() => handleEdit(branch)}
                  title="Edit branch"
                  aria-label={`Edit ${branch.name}`}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="bs-branch-delete"
                  onClick={() => handleDelete(branch)}
                  title="Delete branch"
                  aria-label={`Delete ${branch.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BranchManagement;
