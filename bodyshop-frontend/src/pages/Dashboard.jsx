import { useEffect, useState } from "react";
import { getDashboard } from "../services/dashboardService";
import api from "../api/axios";
import "./Dashboard.css";
import FormModal from "../components/FormModal";
import AdminManagementPanel from "../components/AdminManagementPanel";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [activeSection, setActiveSection] = useState("open");
  const [dashboardData, setDashboardData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

  // UI-only state: does not change dashboard data or API behavior.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);

  const [selectedSummaryTile, setSelectedSummaryTile] = useState(null);

  const [selectedStatusId, setSelectedStatusId] = useState(null);

  const handleSummaryTileClick = (tile, statusId = null) => {
    setSelectedSummaryTile(tile);
    setSelectedStatusId(statusId);
    setPage(1);

    fetchDashboard(activeSection, 1, tile, statusId);
  };

  const handleCreateRecord = () => {
    setEditingRecord(null);
    setShowFormModal(true);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setShowFormModal(true);
  };

  const handleModalSuccess = () => {
    fetchDashboard(activeSection, page);
  };


  const fetchDashboard = async (
    section = activeSection,
    currentPage = page,
    summaryTile = selectedSummaryTile,
    statusId = null,
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = { section, page: currentPage, limit };

      if (search.trim()) params.search = search.trim();
      if (branch) params.branch = branch;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      if (summaryTile) {
        params.summaryTile = summaryTile;
      }

      if (statusId) {
        params.statusId = statusId;
      }

      const data = await getDashboard(params);
      setDashboardData(data);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load dashboard data",
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchDashboard(activeSection, page);
  }, [activeSection, page]);

  useEffect(() => {
    const loadBranches = async () => {
      if (user?.role === "admin") {
        try {
          const response = await api.get("/branches");
          setBranches(response.data.branches || response.data || []);
        } catch (error) {
          console.error(
            "Failed to load branches:",
            error.response?.data?.message || error.message,
          );
        }
        return;
      }

      // Regular users: use only their assigned branches from login data.
      const assignedBranches =
        user?.branches?.length > 0
          ? user.branches
          : user?.branch
            ? [user.branch]
            : [];

      setBranches(assignedBranches);
    };

    loadBranches();
  }, [user?.role]);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setPage(1);
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchDashboard(activeSection, 1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setBranch("");
    setFromDate("");
    setToDate("");
    setPage(1);
    fetchDashboard(activeSection, 1);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const totalPages = dashboardData?.pagination?.totalPages || 1;
  const totalRecords = dashboardData?.pagination?.totalRecords || 0;
  const currentPage = dashboardData?.pagination?.page || page;

  const sections = [
    { id: "open", label: "Open", icon: "◷" },
    { id: "billed", label: "Billed", icon: "✓" },
    { id: "legalLoss", label: "Legal / Loss", icon: "⚖" },
  ];

  return (
    <div
      className={`bs-dashboard-page ${sidebarCollapsed ? "bs-sidebar-collapsed" : ""}`}
    >
      <div className="bs-dashboard-workspace">
        <aside
          className={`bs-dashboard-sidebar ${sidebarCollapsed ? "is-collapsed" : ""
            }`}
          onMouseEnter={() => setSidebarCollapsed(false)}
          onMouseLeave={() => setSidebarCollapsed(true)}
        >
          <div className="bs-dashboard-brand">
            <div className="bs-dashboard-brand-mark">BS</div>
            {!sidebarCollapsed && (
              <div className="bs-dashboard-brand-copy">
                <h1 className="bs-dashboard-title">Body Shop Tracker</h1>
                <p className="bs-dashboard-subtitle">Dashboard</p>
              </div>
            )}
          </div>

          <nav className="bs-dashboard-tabs" aria-label="Dashboard sections">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                title={sidebarCollapsed ? section.label : undefined}
                aria-label={section.label}
                className={`bs-dashboard-tab ${activeSection === section.id ? "bs-dashboard-tab-active" : ""}`}
                onClick={() => handleSectionChange(section.id)}
              >
                <span className="bs-dashboard-tab-icon" aria-hidden="true">
                  {section.icon}
                </span>
                {!sidebarCollapsed && (
                  <span className="bs-dashboard-tab-label">
                    {section.label}
                  </span>
                )}
                {!sidebarCollapsed && activeSection === section.id && (
                  <span className="bs-dashboard-tab-indicator" />
                )}
              </button>
            ))}
          </nav>

          <div className="bs-dashboard-sidebar-user">
            <div className="bs-dashboard-user-avatar" aria-hidden="true">
              {(user?.name || "U").trim().charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="bs-dashboard-sidebar-user-copy">
                <span className="bs-dashboard-user-name">{user?.name}</span>
                <span className="bs-dashboard-user-role">{user?.role}</span>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                className="bs-dashboard-logout"
                onClick={handleLogout}
                title="Logout"
                aria-label="Logout"
              >
                ↪
              </button>
            )}
          </div>
        </aside>

        <main className="bs-dashboard-content">
          <div className="bs-dashboard-toolbar">
            <div className="bs-dashboard-toolbar-title">
              <span className="bs-dashboard-eyebrow">RECORD MANAGEMENT</span>
              <h2>
                {
                  sections.find((section) => section.id === activeSection)
                    ?.label
                }{" "}
                Records
              </h2>
              <span className="bs-dashboard-record-count">
                {totalRecords.toLocaleString()} records
              </span>
            </div>
            <div className="bs-dashboard-toolbar-actions">
              <button
                type="button"
                className={`bs-dashboard-utility-button ${filtersVisible ? "is-active" : ""}`}
                onClick={() => setFiltersVisible((value) => !value)}
                aria-expanded={filtersVisible}
              >
                <span aria-hidden="true">☷</span> Filters{" "}
                <span className="bs-dashboard-chevron">
                  {filtersVisible ? "−" : "+"}
                </span>
              </button>
              <button
                type="button"
                className={`bs-dashboard-utility-button ${summaryVisible ? "is-active" : ""}`}
                onClick={() => setSummaryVisible((value) => !value)}
                aria-expanded={summaryVisible}
              >
                <span aria-hidden="true">▦</span> Summary{" "}
                <span className="bs-dashboard-chevron">
                  {summaryVisible ? "−" : "+"}
                </span>
              </button>
              <button
                className="bs-dashboard-create-button"
                onClick={handleCreateRecord}
              >
                <span aria-hidden="true">＋</span> Create Record
              </button>
              {user?.role === "admin" && (
                <button
                  type="button"
                  className="bs-dashboard-admin-button"
                  onClick={() => setAdminPanelOpen(true)}
                >
                  <span aria-hidden="true">⚙</span>
                  Admin Management
                </button>
              )}
            </div>
          </div>

          <section
            className={`bs-dashboard-collapsible ${filtersVisible ? "is-open" : ""}`}
            aria-hidden={!filtersVisible}
          >
            <div className="bs-dashboard-collapsible-inner">
              <section className="bs-dashboard-filters">
                <div className="bs-dashboard-filter-field bs-dashboard-search-field">
                  <label className="bs-dashboard-filter-label">
                    Search records
                  </label>
                  <input
                    type="text"
                    className="bs-dashboard-filter-input"
                    placeholder="RO number, customer, registration..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleApplyFilters();
                    }}
                  />
                </div>

                <div className="bs-dashboard-filter-field">
                  <label className="bs-dashboard-filter-label">Branch</label>

                  <select
                    className="bs-dashboard-filter-input"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  >
                    <option value="">
                      {user?.role === "admin"
                        ? "All Branches"
                        : "All Assigned Branches"}
                    </option>

                    {branches.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} {item.code ? `(${item.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bs-dashboard-filter-field">
                  <label className="bs-dashboard-filter-label">From Date</label>
                  <input
                    type="date"
                    className="bs-dashboard-filter-input"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="bs-dashboard-filter-field">
                  <label className="bs-dashboard-filter-label">To Date</label>
                  <input
                    type="date"
                    className="bs-dashboard-filter-input"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="bs-dashboard-filter-actions">
                  <button
                    className="bs-dashboard-apply-button"
                    onClick={handleApplyFilters}
                  >
                    Apply filters
                  </button>
                  <button
                    className="bs-dashboard-clear-button"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </button>
                </div>
              </section>
            </div>
          </section>

          {!loading && !error && dashboardData && (
            <section
              className={`bs-dashboard-collapsible bs-dashboard-summary-collapse ${summaryVisible ? "is-open" : ""}`}
              aria-hidden={!summaryVisible}
            >
              <div className="bs-dashboard-collapsible-inner">
                <section className="bs-dashboard-summary">
                  {activeSection === "open" ? (
                    <>
                      <button
                        type="button"
                        className="bs-dashboard-card bs-dashboard-summary-tile"
                        onClick={() => handleSummaryTileClick("open")}
                        title="View all open records"
                      >
                        <span className="bs-dashboard-card-label">
                          Total Open Records
                        </span>
                        <strong className="bs-dashboard-card-value">
                          {(
                            dashboardData.openStatusSummary?.totalOpenRecords ??
                            0
                          ).toLocaleString("en-IN")}
                        </strong>
                      </button>

                      <button
                        type="button"
                        className="bs-dashboard-card bs-dashboard-summary-tile"
                        onClick={() => handleSummaryTileClick("openLabourEstimate")}
                        title="View records with labour estimates"
                      >
                        <span className="bs-dashboard-card-label">
                          Total Labour Estimate
                        </span>
                        <strong className="bs-dashboard-card-value">
                          ₹
                          {(
                            dashboardData.openStatusSummary
                              ?.totalLabourEstimate ?? 0
                          ).toLocaleString("en-IN")}
                        </strong>
                      </button>

                      <button
                        type="button"
                        className="bs-dashboard-card bs-dashboard-summary-tile"
                        onClick={() => handleSummaryTileClick("openPartsEstimate")}
                        title="View records with parts estimates"
                      >
                        <span className="bs-dashboard-card-label">
                          Total Parts Estimate
                        </span>
                        <strong className="bs-dashboard-card-value">
                          ₹
                          {(
                            dashboardData.openStatusSummary
                              ?.totalPartsEstimate ?? 0
                          ).toLocaleString("en-IN")}
                        </strong>
                      </button>

                      {(dashboardData.openStatusSummary?.statuses ?? []).map(
                        (status) => (
                          <button
                            type="button"
                            className="bs-dashboard-card bs-dashboard-summary-tile"
                            key={status.id}
                            onClick={() => handleSummaryTileClick("status", status.id)}
                            title={`View ${status.name} records`}
                          >
                            <span className="bs-dashboard-card-label">
                              {status.name}
                            </span>
                            <strong className="bs-dashboard-card-value">
                              {status.count.toLocaleString("en-IN")}
                            </strong>
                          </button>
                        ),
                      )}
                    </>
                  ) : activeSection === "billed" ? (
                    <>
                      <button
                        type="button"
                        className="bs-dashboard-card bs-dashboard-summary-tile"
                        onClick={() => handleSummaryTileClick("billed")}
                        title="View billed records"
                      >
                        <span className="bs-dashboard-card-label">
                          Total Billed Records
                        </span>
                        <strong className="bs-dashboard-card-value">
                          {(
                            dashboardData.billedStatusSummary?.totalBilledRecords ?? 0
                          ).toLocaleString("en-IN")}
                        </strong>
                      </button>

                      <button
                        type="button"
                        className="bs-dashboard-card bs-dashboard-summary-tile"
                        onClick={() => handleSummaryTileClick("billedLabourBill")}
                        title="View records with labour bill amounts"
                      >
                        <span className="bs-dashboard-card-label">
                          Total Labour Bill
                        </span>
                        <strong className="bs-dashboard-card-value">
                          ₹
                          {(
                            dashboardData.billedStatusSummary?.totalLabourBill ?? 0
                          ).toLocaleString("en-IN")}
                        </strong>
                      </button>

                      <button
                        type="button"
                        className="bs-dashboard-card bs-dashboard-summary-tile"
                        onClick={() => handleSummaryTileClick("billedPartsBill")}
                        title="View records with parts bill amounts"
                      >
                        <span className="bs-dashboard-card-label">
                          Total Parts Bill
                        </span>
                        <strong className="bs-dashboard-card-value">
                          ₹
                          {(
                            dashboardData.billedStatusSummary?.totalPartsBill ?? 0
                          ).toLocaleString("en-IN")}
                        </strong>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="bs-dashboard-card bs-dashboard-summary-tile"
                        onClick={() => handleSummaryTileClick("legalLoss")}
                        title="View legal/loss records"
                      >
                        <span className="bs-dashboard-card-label">
                          Total Legal / Loss Records
                        </span>
                        <strong className="bs-dashboard-card-value">
                          {(
                            dashboardData.legalLossSummary?.totalLegalLossRecords ?? 0
                          ).toLocaleString("en-IN")}
                        </strong>
                      </button>

                      <button
                        type="button"
                        className="bs-dashboard-card bs-dashboard-summary-tile"
                        onClick={() =>
                          handleSummaryTileClick("legalLossLabourEstimate")
                        }
                        title="View legal/loss records with labour estimates"
                      >
                        <span className="bs-dashboard-card-label">
                          Total Labour Estimate
                        </span>
                        <strong className="bs-dashboard-card-value">
                          ₹
                          {(
                            dashboardData.legalLossSummary?.totalLabourEstimate ?? 0
                          ).toLocaleString("en-IN")}
                        </strong>
                      </button>

                      <button
                        type="button"
                        className="bs-dashboard-card bs-dashboard-summary-tile"
                        onClick={() =>
                          handleSummaryTileClick("legalLossPartsEstimate")
                        }
                        title="View legal/loss records with parts estimates"
                      >
                        <span className="bs-dashboard-card-label">
                          Total Parts Estimate
                        </span>
                        <strong className="bs-dashboard-card-value">
                          ₹
                          {(
                            dashboardData.legalLossSummary?.totalPartsEstimate ?? 0
                          ).toLocaleString("en-IN")}
                        </strong>
                      </button>
                    </>
                  )}
                </section>
              </div>
            </section>
          )}

          {/* {loading && (
            <div className="bs-dashboard-loading">Loading records...</div>
          )} */}

          {error && <div className="bs-dashboard-error">{error}</div>}

          {!error && dashboardData && (
            <section className="bs-dashboard-records">
              <div className="bs-dashboard-table-wrapper">
                {loading && (
                  <div className="bs-table-loading-overlay">
                    <img
                      src="/loading.png"
                      alt="Loading..."
                      className="bs-loading-spinner"
                    />
                    {/* <p>Loading records...</p> */}
                  </div>
                )}
                <table className="bs-dashboard-table">
                  <thead>
                    <tr>
                      <th>Sl No</th>
                      <th>Branch</th>
                      <th className="bs-sticky-reg">Registration</th>
                      <th>Yard Entry Date</th>
                      <th>RO Date</th>
                      <th>RO</th>
                      <th>Model</th>
                      <th>Segment</th>
                      <th>Job</th>
                      <th>Status</th>
                      <th>Customer</th>
                      <th>Contact No</th>
                      <th>Insu Status</th>
                      <th>Insu Name</th>
                      <th>SA</th>
                      <th>PMS Date</th>
                      <th>RSA</th>
                      <th>Shield</th>
                      <th>WhatsApp</th>
                      <th>Promise Date</th>
                      <th>Labour Est</th>
                      <th>Parts Est</th>
                      <th>Bill Date</th>
                      <th>Labour Amt</th>
                      <th>Parts Amt</th>

                      {/* <th>Action</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.records?.length > 0 ? (
                      dashboardData.records.map((record) => (
                        <tr
                          key={record._id}
                          onClick={() => handleEditRecord(record)}
                          className={
                            record.isDeliveryOverdue
                              ? "bs-delivery-overdue-row"
                              : ""
                          }
                          title={
                            record.isDeliveryOverdue
                              ? `${record.deliveryDaysOverdue} days past promised delivery date`
                              : undefined
                          }
                        >
                          <td>{record.slNo}</td>
                          <td>{record.branch?.name || "-"}</td>
                          <td className="bs-sticky-reg">{record.regNo}</td>
                          <td>
                            {record.yardEntryDate
                              ? new Date(
                                record.yardEntryDate,
                              ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td>
                            {record.roDate
                              ? new Date(record.roDate).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="bs-dashboard-ro-cell">
                            {record.roNumber}
                          </td>
                          <td>{record.model}</td>
                          <td>{record.subSegmentName || "—"}</td>
                          <td>{record.jobType || "-"}</td>
                          <td>
                            <span className="bs-dashboard-status-pill">
                              {record.presentStatus?.name || "-"}
                            </span>
                          </td>
                          <td>{record.customerName}</td>
                          <td>{record.contactNo || "-"}</td>
                          <td>{record.insuranceStatus || "-"}</td>
                          <td>{record.insuranceName || "-"}</td>
                          <td>{record.serviceAdvisor || "-"}</td>
                          {/* PMS Date */}
                          <td>
                            {record.nextPmsDate
                              ? new Date(
                                record.nextPmsDate,
                              ).toLocaleDateString()
                              : "-"}
                          </td>

                          {/* RSA */}
                          <td>{record.rsaEligibility || "-"}</td>

                          {/* Shield */}
                          <td>{record.shieldEligibility || "-"}</td>

                          {/* WhatsApp */}
                          <td>
                            {record.whatsappGroupCreationDate
                              ? new Date(
                                record.whatsappGroupCreationDate,
                              ).toLocaleDateString()
                              : "-"}
                          </td>

                          {/* Promise Date */}
                          <td>
                            {record.promisedDeliveryDate
                              ? new Date(
                                record.promisedDeliveryDate,
                              ).toLocaleDateString()
                              : "-"}
                          </td>

                          {/* Labour Estimate */}
                          <td>{record.labourEstimate ?? "-"}</td>

                          {/* Parts Estimate */}
                          <td>{record.partsEstimate ?? "-"}</td>

                          {/* Bill Date */}
                          <td>
                            {record.billDate
                              ? new Date(record.billDate).toLocaleDateString()
                              : "-"}
                          </td>

                          {/* Labour Amount */}
                          <td>{record.labourBillAmount ?? "-"}</td>

                          {/* Parts Amount */}
                          <td>{record.partsBillAmount ?? "-"}</td>

                          {/* <td>
                            <button
                              className="bs-dashboard-edit-button"
                              onClick={() => handleEditRecord(record)}
                            >
                              Edit
                            </button>
                          </td> */}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="24" className="bs-dashboard-empty">
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bs-dashboard-pagination">
                <span className="bs-dashboard-pagination-info">
                  Page <strong>{currentPage}</strong> of{" "}
                  <strong>{totalPages}</strong>
                </span>
                <div className="bs-dashboard-pagination-controls">
                  <button
                    className="bs-dashboard-page-button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    ← Previous
                  </button>
                  <button
                    className="bs-dashboard-page-button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
      {user?.role === "admin" && (
        <AdminManagementPanel
          isOpen={adminPanelOpen}
          onClose={() => setAdminPanelOpen(false)}
        />
      )}

      <FormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        editRecord={editingRecord}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

export default Dashboard;
