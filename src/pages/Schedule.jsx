import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./Schedule.css";

function Schedule() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    time: "",
    activity: "",
    message: "",
    repeat: "daily",
    whatsappEnabled: true,
    enabled: true
  });
  const [saving, setSaving] = useState(false);

  const admin = JSON.parse(
    localStorage.getItem("admin") || "null"
  );

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError("");

      const patientResponse = await api.get("/customers");

      const patientList = Array.isArray(patientResponse.data)
        ? patientResponse.data
        : patientResponse.data?.customers || [];

      setPatients(patientList);

      const results = await Promise.all(
        patientList.map(async (patient) => {
          try {
            const response = await api.get(
              `/schedules/customer/${patient._id}`
            );

            const patientSchedules = Array.isArray(response.data)
              ? response.data
              : response.data?.schedules || [];

            return patientSchedules.map((schedule) => ({
              ...schedule,
              patient
            }));
          } catch (err) {
            console.error(
              `Failed to load schedules for ${patient._id}`,
              err
            );

            return [];
          }
        })
      );

      setSchedules(results.flat());
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load schedules"
      );
    } finally {
      setLoading(false);
    }
  };

  const convertTimeToMinutes = (time) => {
    const value = String(time)
      .trim()
      .toUpperCase();

    const match = value.match(
      /^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/
    );

    if (!match) {
      return Number.MAX_SAFE_INTEGER;
    }

    let hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    const period = match[3];

    if (period === "AM" && hour === 12) {
      hour = 0;
    }

    if (period === "PM" && hour !== 12) {
      hour += 12;
    }

    return hour * 60 + minute;
  };

  const sortedSchedules = useMemo(() => {
    return [...schedules].sort(
      (a, b) =>
        convertTimeToMinutes(a.time) -
        convertTimeToMinutes(b.time)
    );
  }, [schedules]);

  const formatTime = (time) => {
    return time || "—";
  };

  const getRepeatLabel = (repeat) => {
    return repeat === "once" ? "Once" : "Daily";
  };

  const getStatusLabel = (enabled) => {
    return enabled === false ? "Disabled" : "Active";
  };

  const handleToggle = async (schedule) => {
    try {
      await api.put(
        `/schedules/${schedule._id}`,
        {
          enabled: !schedule.enabled
        }
      );

      await loadSchedules();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update schedule"
      );
    }
  };

  const startEdit = (schedule) => {
    setEditingId(schedule._id);

    setEditForm({
      time: schedule.time || "",
      activity: schedule.activity || "",
      message: schedule.message || "",
      repeat: schedule.repeat || "daily",
      whatsappEnabled:
        schedule.whatsappEnabled !== false,
      enabled: schedule.enabled !== false
    });

    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);

    setEditForm({
      time: "",
      activity: "",
      message: "",
      repeat: "daily",
      whatsappEnabled: true,
      enabled: true
    });
  };

  const updateEditField = (field, value) => {
    setEditForm((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const saveEdit = async () => {
    if (!editForm.time.trim()) {
      setError("Time is required.");
      return;
    }

    if (!editForm.activity.trim()) {
      setError("Activity is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.put(
        `/schedules/${editingId}`,
        {
          time: editForm.time.trim(),
          activity: editForm.activity.trim(),
          message:
            editForm.message.trim() ||
            editForm.activity.trim(),
          repeat: editForm.repeat,
          whatsappEnabled:
            editForm.whatsappEnabled,
          enabled: editForm.enabled
        }
      );

      cancelEdit();
      await loadSchedules();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to save schedule"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (schedule) => {
    const confirmed = window.confirm(
      `Delete "${schedule.activity}" at ${schedule.time}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/schedules/${schedule._id}`
      );

      await loadSchedules();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete schedule"
      );
    }
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

          <button
            className="nav-item"
            onClick={() =>
              navigate("/nutrition-plans")
            }
          >
            <span>▤</span>
            Nutrition Plans
          </button>

          <button className="nav-item active">
            <span>◷</span>
            Schedule
          </button>

          <button
            onClick={() =>
              navigate("/reminder-history")
            }
            className="nav-item"
          >
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

      <main className="schedule-main">
        <div className="page-header">
          <div>
            <h1>Schedule</h1>

            <p>
              Manage automated nutrition reminders
              for all patients.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={loadSchedules}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="schedule-state">
            <div className="loading-spinner"></div>

            <p>
              Loading schedules...
            </p>
          </div>
        ) : error ? (
          <div className="schedule-error">
            {error}
          </div>
        ) : sortedSchedules.length === 0 ? (
          <div className="empty-schedule">
            <div className="empty-icon">
              ◷
            </div>

            <h2>
              No schedules found
            </h2>

            <p>
              Confirm a nutrition plan to
              generate schedules.
            </p>

            <button
              onClick={() =>
                navigate("/patients")
              }
            >
              Go to Patients
            </button>
          </div>
        ) : (
          <div className="schedule-card">
            <div className="schedule-card-header">
              <div>
                <h2>
                  All Schedules
                </h2>

                <span>
                  {sortedSchedules.length} schedule
                  {sortedSchedules.length !== 1
                    ? "s"
                    : ""}
                </span>
              </div>
            </div>

            <div className="schedule-table-wrapper">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Time</th>
                    <th>Activity</th>
                    <th>Message</th>
                    <th>Repeat</th>
                    <th>WhatsApp</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedSchedules.map(
                    (schedule) => (
                      <tr key={schedule._id}>
                        <td>
                          <div className="patient-cell">
                            <div className="patient-avatar">
                              {(schedule.patient?.name ||
                                "P")
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {schedule.patient?.name ||
                                  "Unknown Patient"}
                              </strong>

                              <span>
                                {schedule.patient?.phone ||
                                  "—"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="time-value">
                            {formatTime(
                              schedule.time
                            )}
                          </span>
                        </td>

                        <td>
                          <strong className="activity-value">
                            {schedule.activity}
                          </strong>
                        </td>

                        <td>
                          <span
                            className="message-value"
                            title={schedule.message}
                          >
                            {schedule.message}
                          </span>
                        </td>

                        <td>
                          <span className="repeat-badge">
                            {getRepeatLabel(
                              schedule.repeat
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              schedule.whatsappEnabled
                                ? "whatsapp-on"
                                : "whatsapp-off"
                            }
                          >
                            {schedule.whatsappEnabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </td>

                        <td>
                          <button
                            className={
                              schedule.enabled
                                ? "status-toggle active"
                                : "status-toggle"
                            }
                            onClick={() =>
                              handleToggle(
                                schedule
                              )
                            }
                          >
                            {getStatusLabel(
                              schedule.enabled
                            )}
                          </button>
                        </td>

                        <td>
                          <div className="schedule-actions">
                            <button
                              className="action-view"
                              onClick={() =>
                                navigate(
                                  `/patients/${
                                    schedule.patient?._id ||
                                    schedule.customerId
                                  }`
                                )
                              }
                            >
                              View
                            </button>

                            <button
                              className="action-edit"
                              onClick={() =>
                                startEdit(schedule)
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="action-delete"
                              onClick={() =>
                                handleDelete(
                                  schedule
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {editingId && (
          <div className="schedule-edit-overlay">
            <div className="schedule-edit-modal">
              <div className="schedule-edit-header">
                <div>
                  <p>Edit Schedule</p>
                  <h2>Update Reminder</h2>
                </div>

                <button
                  className="schedule-edit-close"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  ×
                </button>
              </div>

              <div className="schedule-edit-form">
                <label>
                  Time
                  <input
                    value={editForm.time}
                    onChange={(event) =>
                      updateEditField(
                        "time",
                        event.target.value
                      )
                    }
                    placeholder="08:00 AM"
                  />
                </label>

                <label>
                  Activity
                  <input
                    value={editForm.activity}
                    onChange={(event) =>
                      updateEditField(
                        "activity",
                        event.target.value
                      )
                    }
                    placeholder="Breakfast"
                  />
                </label>

                <label>
                  Message
                  <textarea
                    value={editForm.message}
                    onChange={(event) =>
                      updateEditField(
                        "message",
                        event.target.value
                      )
                    }
                    placeholder="Have your breakfast"
                    rows="3"
                  />
                </label>

                <label>
                  Repeat
                  <select
                    value={editForm.repeat}
                    onChange={(event) =>
                      updateEditField(
                        "repeat",
                        event.target.value
                      )
                    }
                  >
                    <option value="daily">
                      Daily
                    </option>

                    <option value="once">
                      Once
                    </option>
                  </select>
                </label>

                <div className="schedule-edit-checks">
                  <label className="edit-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        editForm.whatsappEnabled
                      }
                      onChange={(event) =>
                        updateEditField(
                          "whatsappEnabled",
                          event.target.checked
                        )
                      }
                    />
                    WhatsApp Enabled
                  </label>

                  <label className="edit-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        editForm.enabled
                      }
                      onChange={(event) =>
                        updateEditField(
                          "enabled",
                          event.target.checked
                        )
                      }
                    />
                    Schedule Enabled
                  </label>
                </div>
              </div>

              <div className="schedule-edit-actions">
                <button
                  className="schedule-edit-cancel"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  className="schedule-edit-save"
                  onClick={saveEdit}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Schedule;
