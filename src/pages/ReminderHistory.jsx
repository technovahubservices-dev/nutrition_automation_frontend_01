import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./ReminderHistory.css";

function ReminderHistory() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReminderHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const patientsResponse = await api.get("/customers");

      const patientList = Array.isArray(patientsResponse.data)
        ? patientsResponse.data
        : patientsResponse.data?.customers || [];

      setPatients(patientList);

      const results = await Promise.all(
        patientList.map(async (patient) => {
          try {
            const response = await api.get(
              `/reminders/customer/${patient._id}`
            );

            const patientReminders = Array.isArray(response.data)
              ? response.data
              : response.data?.reminders || [];

            return patientReminders.map((reminder) => ({
              ...reminder,
              patient
            }));
          } catch (err) {
            console.error(
              `Failed to load reminders for ${patient._id}`,
              err
            );

            return [];
          }
        })
      );

      setReminders(results.flat());
    } catch (err) {
      console.error("Failed to load reminder history:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load reminder history"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminderHistory();
  }, []);

  const sortedReminders = useMemo(() => {
    return [...reminders].sort(
      (a, b) =>
        new Date(b.triggeredAt || b.createdAt || 0) -
        new Date(a.triggeredAt || a.createdAt || 0)
    );
  }, [reminders]);

  const getStatusLabel = (status) => {
    switch (status) {
      case "sent":
        return "Sent";
      case "failed":
        return "Failed";
      case "pending":
      default:
        return "Pending";
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const sentCount = reminders.filter(
    (item) => item.status === "sent"
  ).length;

  const pendingCount = reminders.filter(
    (item) => item.status === "pending"
  ).length;

  const failedCount = reminders.filter(
    (item) => item.status === "failed"
  ).length;

  return (
    <div className="reminder-history-page">
      <aside className="reminder-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">N</div>

          <div>
            <strong>Nutrition</strong>
            <span>Automation</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className="nav-item"
            onClick={() => navigate("/dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/patients")}
          >
            <span>♙</span>
            Patients
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/nutrition-plans")}
          >
            <span>▣</span>
            Nutrition Plans
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/schedule")}
          >
            <span>◷</span>
            Schedule
          </button>

          <button className="nav-item active">
            <span>✓</span>
            Reminder History
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="nav-item"
            onClick={() => {
              localStorage.removeItem("adminToken");
              localStorage.removeItem("admin");
              navigate("/login");
            }}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="reminder-main">
        <div className="reminder-header">
          <div>
            <p className="page-eyebrow">AUTOMATION</p>
            <h1>Reminder History</h1>
            <p>
              Track automated nutrition reminders and their current
              delivery status.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={loadReminderHistory}
          >
            ↻ Refresh
          </button>
        </div>

        <section className="reminder-stats">
          <div className="reminder-stat-card">
            <span>Total Reminders</span>
            <strong>{reminders.length}</strong>
          </div>

          <div className="reminder-stat-card">
            <span>Sent</span>
            <strong>{sentCount}</strong>
          </div>

          <div className="reminder-stat-card">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>

          <div className="reminder-stat-card">
            <span>Failed</span>
            <strong>{failedCount}</strong>
          </div>
        </section>

        {loading ? (
          <div className="reminder-state">
            <div className="loading-spinner"></div>
            <p>Loading reminder history...</p>
          </div>
        ) : error ? (
          <div className="reminder-error">
            {error}
          </div>
        ) : sortedReminders.length === 0 ? (
          <div className="empty-reminder">
            <div className="empty-icon">✓</div>
            <h2>No reminder history yet</h2>
            <p>
              Reminder history will appear here when the scheduler
              triggers a nutrition reminder.
            </p>
          </div>
        ) : (
          <section className="reminder-card">
            <div className="reminder-card-header">
              <div>
                <h2>Reminder Activity</h2>
                <span>
                  {sortedReminders.length} reminder
                  {sortedReminders.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="reminder-table-wrapper">
              <table className="reminder-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Activity</th>
                    <th>Scheduled</th>
                    <th>Triggered At</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedReminders.map((reminder) => (
                    <tr key={reminder._id}>
                      <td>
                        <div className="patient-cell">
                          <div className="patient-avatar">
                            {(reminder.patient?.name || "P")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {reminder.patient?.name ||
                                "Unknown Patient"}
                            </strong>

                            <span>
                              {reminder.patient?.phone || "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="activity-cell">
                          <strong>
                            {reminder.scheduleId?.activity ||
                              "Reminder"}
                          </strong>

                          <span>
                            {reminder.scheduleId?.message || "—"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="scheduled-time">
                          {reminder.scheduleId?.time || "—"}
                        </span>
                      </td>

                      <td>
                        <span className="triggered-time">
                          {formatDateTime(reminder.triggeredAt)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`reminder-status status-${reminder.status}`}
                        >
                          {getStatusLabel(reminder.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default ReminderHistory;
