
import { useState } from "react";
import "./AdminManagementPanel.css";

import BranchManagement from "./BranchManagement";
import UserManagement from "./UserManagement";
import StatusManagement from "./StatusManagement";
import ModelManagement from "./ModelManagement";
import InsuranceManagement from "./InsuranceManagement";
import ServiceAdvisorManagement from "./ServiceAdvisorManagement";

const sections = [
  { id: "branches", label: "Branches", icon: "⑂" },
  { id: "users", label: "Users", icon: "♙" },
  { id: "statuses", label: "Statuses", icon: "☷" },
  { id: "models", label: "Models", icon: "🚙" },
  { id: "insurance", label: "Insurance", icon: "▤" },
  { id: "service-advisors", label: "Service Advisers", icon: "♧" },
];

function AdminManagementPanel({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState("branches");

  if (!isOpen) return null;

  const activeItem = sections.find(
    (item) => item.id === activeSection
  );

  return (
    <div
      className="bs-admin-panel-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        className="bs-admin-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Admin Management"
      >
        <header className="bs-admin-panel-header">
          <div className="bs-admin-panel-heading">
            <span className="bs-admin-panel-eyebrow">
              ADMINISTRATION
            </span>

            <h2>Management</h2>

            <p>Manage your Body Shop Tracker settings</p>
          </div>

          <button
            type="button"
            className="bs-admin-panel-close"
            onClick={onClose}
            aria-label="Close admin management"
          >
            ×
          </button>
        </header>

        <nav
          className="bs-admin-panel-nav"
          aria-label="Management sections"
        >
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`bs-admin-panel-nav-item ${
                activeSection === item.id ? "is-active" : ""
              }`}
              onClick={() => setActiveSection(item.id)}
              aria-current={
                activeSection === item.id ? "page" : undefined
              }
            >
              {/* <span className="bs-admin-panel-nav-icon">
                {item.icon}
              </span> */}

              <span className="bs-admin-panel-nav-label">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <section className="bs-admin-panel-body">
          <div className="bs-admin-panel-section-heading">
            <div>
              <h3>{activeItem?.label}</h3>
              <p>
                {activeSection === "branches" &&
                  "Create and manage branch locations."}
                {activeSection === "users" &&
                  "Manage user and manager accounts."}
                {activeSection === "statuses" &&
                  "Configure record statuses."}
                {activeSection === "models" &&
                  "Manage vehicle models."}
                {activeSection === "insurance" &&
                  "Manage insurance companies."}
                {activeSection === "service-advisors" &&
                  "Manage service advisers by branch."}
              </p>
            </div>
          </div>

          <div className="bs-admin-panel-content">
            {activeSection === "branches" && <BranchManagement />}
            {activeSection === "users" && <UserManagement />}
            {activeSection === "statuses" && <StatusManagement />}
            {activeSection === "models" && <ModelManagement />}
            {activeSection === "insurance" && <InsuranceManagement />}
            {activeSection === "service-advisors" && (
              <ServiceAdvisorManagement />
            )}
          </div>
        </section>

        <footer className="bs-admin-panel-footer">
          <span className="bs-admin-panel-footer-dot" />
          <span>Admin workspace</span>
          <span className="bs-admin-panel-footer-version">
            Body Shop Tracker
          </span>
        </footer>
      </aside>
    </div>
  );
}

export default AdminManagementPanel;
