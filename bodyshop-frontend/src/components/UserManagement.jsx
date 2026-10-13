import { useEffect, useState } from "react";
import api from "../api/axios";
import "./UserManagement.css";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  branch: "",
};

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [usersResponse, branchesResponse] = await Promise.all([
        api.get("/users"),
        api.get("/branches"),
      ]);

      setUsers(usersResponse.data.users || []);

      const branchData = branchesResponse.data;
      setBranches(
        Array.isArray(branchData) ? branchData : branchData.branches || [],
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load users and branches.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEdit = (user) => {
    setEditingId(user._id);

    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      branch: user.branch?._id || "",
    });

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim() || !form.branch) {
      setError("Name, email, and branch are required.");
      return;
    }

    if (!editingId && !form.password) {
      setError("Password is required when creating a user.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        branch: form.branch,
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
        setSuccess("User updated successfully.");
      } else {
        await api.post("/users", {
          ...payload,
          password: form.password,
        });
        setSuccess("User created successfully.");
      }

      resetForm();
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save user.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.isActive;

    const confirmed = window.confirm(
      `${nextStatus ? "Activate" : "Deactivate"} ${user.name}?`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.put(`/users/${user._id}`, {
        isActive: nextStatus,
      });

      setSuccess(`${user.name} ${nextStatus ? "activated" : "deactivated"}.`);

      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to change user status.");
    }
  };

  const handleDeactivate = async (user) => {
    if (!user.isActive) return;

    const confirmed = window.confirm(
      `Deactivate ${user.name}? They will remain in the database.`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/users/${user._id}`);

      setSuccess(`${user.name} deactivated successfully.`);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to deactivate user.");
    }
  };

  return (
    <div className="bs-user-management">
      <div className="bs-user-heading">
        <div>
          <h3>User Management</h3>
          <p>Manage accounts and branch assignments.</p>
        </div>

        <button
          type="button"
          className="bs-user-refresh"
          onClick={fetchData}
          disabled={loading}
          title="Refresh users"
        >
          ↻
        </button>
      </div>

      {error && (
        <div className="bs-user-alert bs-user-alert-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="bs-user-alert bs-user-alert-success" role="status">
          {success}
        </div>
      )}

      <section className="bs-user-form-section">
        <div className="bs-user-section-title">
          <div>
            <h4>{editingId ? "Edit user" : "Create user"}</h4>
            <p>
              {editingId
                ? "Update account details and branch."
                : "Create a user account for a branch."}
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              className="bs-user-cancel"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel edit
            </button>
          )}
        </div>

        <form className="bs-user-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter full name"
              autoComplete="name"
              required
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="sneha@outlook.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Branch
            <select
              name="branch"
              value={form.branch}
              onChange={handleChange}
              required
            >
              <option value="">Select branch</option>
              {branches
                .filter((branch) => branch.isActive !== false)
                .map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
            </select>
          </label>

          <label>
            Password {editingId && "(leave blank to keep current)"}
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={
                editingId ? "Optional new password" : "Create password"
              }
              autoComplete="new-password"
              required={!editingId}
            />
          </label>

          <div className="bs-user-form-actions">
            <button type="submit" className="bs-user-save" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Create user"}
            </button>

            {editingId && (
              <button
                type="button"
                className="bs-user-cancel"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="bs-user-list-section">
        <div className="bs-user-list-heading">
          <div>
            <h4>All users</h4>
            <p>{users.length} accounts</p>
          </div>
        </div>

        <div className="bs-user-table-wrap">
          {loading ? (
            <p className="bs-user-empty">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="bs-user-empty">No users found.</p>
          ) : (
            <table className="bs-user-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Branch</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="bs-user-identity">
                        <span className="bs-user-avatar">
                          {(user.name || "?").charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="bs-user-branch">
                        <span>{user.branch?.name || "No branch"}</span>
                        {user.branch?.code && <small>{user.branch.code}</small>}
                      </div>
                    </td>

                    <td>
                      <span className="bs-user-role">
                        {user.role || "user"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`bs-user-status ${
                          user.isActive ? "is-active" : "is-inactive"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="bs-user-actions">
                        <button
                          type="button"
                          className="bs-user-edit"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="bs-user-status-action"
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>

                        {user.isActive && (
                          <button
                            type="button"
                            className="bs-user-delete"
                            onClick={() => handleDeactivate(user)}
                          >
                            Disable
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

export default UserManagement;
