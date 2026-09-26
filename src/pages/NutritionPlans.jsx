import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./NutritionPlans.css";

function NutritionPlans() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const admin = JSON.parse(
    localStorage.getItem("admin") || "null"
  );

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/nutrition-plans");

      const planList = Array.isArray(response.data)
        ? response.data
        : response.data?.plans || [];

      setPlans(planList);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
        "Failed to load nutrition plans"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const getFileLabel = (fileType) => {
    if (fileType === "excel") return "Excel";
    if (fileType === "pdf") return "PDF";
    return fileType || "—";
  };

  const getStatusLabel = (status) => {
    if (status === "processed") return "Confirmed";
    if (status === "uploaded") return "Uploaded";
    if (status === "failed") return "Failed";
    return status || "Unknown";
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✚</div>

          <div>
            <h2>NutriCare</h2>
            <span>Automation</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className="nav-item"
            onClick={() => navigate("/dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/patients")}
          >
            <span>♙</span>
            Patients
          </button>

          <button className="nav-item active">
            <span>▤</span>
            Nutrition Plans
          </button>

          <button onClick={() => navigate("/schedule")} className="nav-item">
            <span>◷</span>
            Schedule
          </button>

          <button onClick={() => navigate("/reminder-history")} className="nav-item">
            <span>✓</span>
            Reminder History
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-mini">
            <div className="admin-avatar">
              {(admin?.name || "A")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {admin?.name || "Admin"}
              </strong>

              <span>
                {admin?.email || ""}
              </span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            ⇥ Logout
          </button>
        </div>
      </aside>

      <main className="nutrition-plans-main">
        <div className="page-header">
          <div>
            <h1>Nutrition Plans</h1>
            <p>
              Manage uploaded and confirmed patient
              nutrition plans.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={loadPlans}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="plans-state">
            <div className="loading-spinner"></div>
            <p>Loading nutrition plans...</p>
          </div>
        ) : error ? (
          <div className="plans-error">
            {error}
          </div>
        ) : plans.length === 0 ? (
          <div className="empty-plans">
            <div className="empty-icon">▤</div>

            <h2>No nutrition plans</h2>

            <p>
              Upload a nutrition plan from a
              patient's details page.
            </p>

            <button
              onClick={() => navigate("/patients")}
            >
              Go to Patients
            </button>
          </div>
        ) : (
          <div className="plans-card">
            <div className="plans-card-header">
              <div>
                <h2>All Nutrition Plans</h2>
                <span>
                  {plans.length} plan
                  {plans.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="plans-table-wrapper">
              <table className="plans-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>File</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Uploaded</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan._id}>
                      <td>
                        <div className="patient-cell">
                          <div className="patient-avatar">
                            {(plan.customerId?.name || "P")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {plan.customerId?.name ||
                                "Unknown Patient"}
                            </strong>

                            <span>
                              {plan.customerId?.phone ||
                                "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="file-cell">
                          <span className="file-icon">
                            {plan.fileType === "pdf"
                              ? "PDF"
                              : "XLS"}
                          </span>

                          <span
                            className="file-name"
                            title={plan.fileName}
                          >
                            {plan.fileName}
                          </span>
                        </div>
                      </td>

                      <td>
                        {getFileLabel(plan.fileType)}
                      </td>

                      <td>
                        <span
                          className={`status-badge status-${plan.status}`}
                        >
                          <span className="status-dot"></span>
                          {getStatusLabel(
                            plan.status
                          )}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          plan.uploadedAt ||
                            plan.createdAt
                        )}
                      </td>

                      <td>
                        <button
                          className="view-patient-button"
                          onClick={() =>
                            navigate(
                              `/patients/${plan.customerId?._id || plan.customerId}`
                            )
                          }
                        >
                          View Patient
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default NutritionPlans;


