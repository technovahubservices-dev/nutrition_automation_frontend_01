import {  useEffect, useState , Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import "./PatientDetails.css";

function Sidebar({ admin, navigate, logout }) {
  return (
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
          className="nav-item active"
          onClick={() => navigate("/patients")}
        >
          <span>♙</span>
          Patients
        </button>

        <button
  className="nav-item"
  onClick={() => navigate("/nutrition-plans")}
>
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
            {(admin?.name || "A").charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{admin?.name || "Admin"}</strong>
            <span>{admin?.email || ""}</span>
          </div>
        </div>

        <button className="logout-button" onClick={logout}>
          ⇥ Logout
        </button>
      </div>
    </aside>
  );
}

function TimePicker({ value, onChange }) {
  const parseTime = (rawValue) => {
    const value = String(rawValue || "09:00 AM").trim();
    const match = value.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!match) return { hour: "09", minute: "00", period: "AM" };

    let hour = Number(match[1]);
    const minute = match[2];
    let period = (match[3] || (hour >= 12 ? "PM" : "AM")).toUpperCase();

    if (!match[3]) {
      if (hour === 0) hour = 12;
      else if (hour > 12) hour -= 12;
    }

    return {
      hour: String(hour >= 1 && hour <= 12 ? hour : 9).padStart(2, "0"),
      minute,
      period
    };
  };

  const parts = parseTime(value);
  const updatePart = (key, nextValue) => {
    const next = { ...parts, [key]: nextValue };
    onChange(`${Number(next.hour)}:${next.minute} ${next.period}`);
  };

  return (
    <div className="time-picker-row">
      <select aria-label="Hour" value={parts.hour} onChange={(e) => updatePart("hour", e.target.value)}>
        {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")).map((hour) => (
          <option key={hour} value={hour}>{hour}</option>
        ))}
      </select>
      <span className="time-picker-colon">:</span>
      <select aria-label="Minute" value={parts.minute} onChange={(e) => updatePart("minute", e.target.value)}>
        {Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0")).map((minute) => (
          <option key={minute} value={minute}>{minute}</option>
        ))}
      </select>
      <select aria-label="AM or PM" value={parts.period} onChange={(e) => updatePart("period", e.target.value)}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
function PatientDetails() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [plans, setPlans] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [scheduleEditForm, setScheduleEditForm] = useState({});
  const [scheduleEditError, setScheduleEditError] = useState("");
  const [scheduleEditSaving, setScheduleEditSaving] = useState(false);
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [scheduleCreateForm, setScheduleCreateForm] = useState({
    time: "09:00 AM",
    activity: "",
    message: "",
    startDate: new Date().toISOString().slice(0, 10),
    durationDays: "1",
    whatsappEnabled: true,
  });
  const [scheduleCreateError, setScheduleCreateError] = useState("");
  const [scheduleCreateSaving, setScheduleCreateSaving] = useState(false);

  const admin = JSON.parse(
    localStorage.getItem("admin") || "null"
  );

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  useEffect(() => {
    const loadPatientDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          patientResponse,
          plansResponse,
          schedulesResponse
        ] = await Promise.all([
          api.get(`/customers/${patientId}`),
          api.get(`/nutrition-plans/customer/${patientId}`),
          api.get(`/schedules/customer/${patientId}`)
        ]);

        setPatient(
          patientResponse.data.customer ||
          patientResponse.data
        );

        const planData =
          plansResponse.data.plans ||
          plansResponse.data ||
          [];

        const scheduleData =
          schedulesResponse.data.schedules ||
          schedulesResponse.data ||
          [];

        setPlans(Array.isArray(planData) ? planData : []);
        setSchedules(
          Array.isArray(scheduleData)
            ? scheduleData
            : []
        );
      } catch (err) {
        console.error("Failed to load patient details:", err);

        setError(
          err.response?.data?.message ||
          "Failed to load patient details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadPatientDetails();
  }, [patientId]);

  if (loading) {
    return (
      <div className="dashboard-shell">
        <Sidebar
          admin={admin}
          navigate={navigate}
          logout={logout}
        />

        <main className="patient-details-main">
          <div className="loading-state">
            Loading patient details...
          </div>
        </main>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="dashboard-shell">
        <Sidebar
          admin={admin}
          navigate={navigate}
          logout={logout}
        />

        <main className="patient-details-main">
          <button
            className="details-back-button"
            onClick={() => navigate("/patients")}
          >
            ← Back to Patients
          </button>

          <div className="error-state">
            {error || "Patient not found"}
          </div>
        </main>
      </div>
    );
  }

  const processedPlans = plans.filter(
    (plan) => plan.status === "processed"
  );
  const beginScheduleEdit = (schedule) => {
    setEditingScheduleId(schedule._id);
    setScheduleEditError("");
    setScheduleEditForm({
      time: schedule.time || "",
      activity: schedule.activity || "",
      message: schedule.message || "",
      startDate: schedule.startDate || new Date().toISOString().slice(0, 10),
      durationDays: schedule.durationDays || 5,
      whatsappEnabled: schedule.whatsappEnabled !== false,
      enabled: schedule.enabled !== false
    });
  };

  const openCreateSchedule = () => {
    setScheduleCreateError("");
    setScheduleCreateForm({
      time: "09:00 AM",
      activity: "",
      message: "",
      startDate: new Date().toISOString().slice(0, 10),
      durationDays: "1",
      whatsappEnabled: true,
    });
    setShowCreateSchedule(true);
  };

  const saveNewSchedule = async () => {
    setScheduleCreateError("");
    if (!scheduleCreateForm.time || !scheduleCreateForm.message.trim()) {
      setScheduleCreateError("Please enter a time and message.");
      return;
    }

    const durationDays = Number(scheduleCreateForm.durationDays);
    if (!Number.isInteger(durationDays) || durationDays < 1) {
      setScheduleCreateError("Duration must be at least 1 day.");
      return;
    }

    setScheduleCreateSaving(true);
    try {
      await api.post(`/schedules/customer/${patientId}`, {
        time: scheduleCreateForm.time,
        activity: scheduleCreateForm.activity.trim(),
        message: scheduleCreateForm.message.trim(),
        startDate: scheduleCreateForm.startDate,
        durationDays,
        whatsappEnabled: scheduleCreateForm.whatsappEnabled,
      });
      const response = await api.get(`/schedules/customer/${patientId}`);
      setSchedules(response.data);
      setShowCreateSchedule(false);
    } catch (err) {
      setScheduleCreateError(
        err.response?.data?.message || err.response?.data?.error || "Could not create schedule."
      );
    } finally {
      setScheduleCreateSaving(false);
    }
  };
  const saveScheduleEdit = async (scheduleId) => {
    const durationDays = Number(scheduleEditForm.durationDays);
    if (!scheduleEditForm.startDate || !Number.isInteger(durationDays) || durationDays < 1) {
      setScheduleEditError("Enter a start date and a duration of at least 1 whole day.");
      return;
    }
    try {
      setScheduleEditSaving(true);
      setScheduleEditError("");
      const response = await api.put(`/schedules/${scheduleId}`, {
        ...scheduleEditForm,
        durationDays
      });
      const updated = response.data?.schedule;
      setSchedules((previous) => previous.map((item) =>
        item._id === scheduleId ? { ...item, ...(updated || scheduleEditForm), durationDays } : item
      ));
      setEditingScheduleId(null);
      setScheduleEditForm({});
    } catch (err) {
      setScheduleEditError(err.response?.data?.message || "Could not update this schedule.");
    } finally {
      setScheduleEditSaving(false);
    }
  };

  const handleScheduleDelete = async (schedule) => {
    const confirmed = window.confirm(
      `Delete "${schedule.activity || "this reminder"}" at ${schedule.time || "the scheduled time"}?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/schedules/${schedule._id}`);
      setSchedules((previous) =>
        previous.filter((item) => item._id !== schedule._id)
      );
      if (editingScheduleId === schedule._id) {
        setEditingScheduleId(null);
        setScheduleEditForm({});
        setScheduleEditError("");
      }
    } catch (err) {
      window.alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Could not delete this reminder schedule."
      );
    }
  };
  const activeSchedules = schedules
    .filter((schedule) => schedule.enabled !== false)
    .sort((a, b) => {
      const parseTime = (value) => {
        const match = String(value)
          .trim()
          .match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/i);

        if (!match) return Number.MAX_SAFE_INTEGER;

        let hour = Number(match[1]);
        const minute = Number(match[2] || 0);
        const period = match[3].toUpperCase();

        if (period === "AM" && hour === 12) {
          hour = 0;
        }

        if (period === "PM" && hour !== 12) {
          hour += 12;
        }

        return hour * 60 + minute;
      };

      return parseTime(a.time) - parseTime(b.time);
    });

  const activePlan =
    processedPlans.length > 0
      ? processedPlans[processedPlans.length - 1]
      : null;

  return (
    <div className="dashboard-shell">
      <Sidebar
        admin={admin}
        navigate={navigate}
        logout={logout}
      />

      <main className="patient-details-main">

        <button
          className="details-back-button"
          onClick={() => navigate("/patients")}
        >
          ← Back to Patients
        </button>

        <div className="details-header">
          <div className="patient-title-section">
            <div className="patient-large-avatar">
              {patient.name?.charAt(0).toUpperCase() || "P"}
            </div>

            <div>
              <span className="section-label">
                PATIENT DETAILS
              </span>

              <h1>{patient.name}</h1>

              <span className="status-badge active">
                Active
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-state">
            {error}
          </div>
        )}

        <div className="details-grid">

          {/* INFORMATION */}
          <section className="details-card">
            <div className="card-section-title">
              <span>INFORMATION</span>
            </div>

            <h2>Patient Information</h2>

            <div className="patient-info-grid">

              <div className="info-item">
                <span>Name</span>
                <strong>{patient.name}</strong>
              </div>

              <div className="info-item">
                <span>Phone</span>
                <strong>{patient.phone}</strong>
              </div>

              <div className="info-item">
                <span>WhatsApp</span>
                <strong>{patient.whatsappNumber}</strong>
              </div>

              <div className="info-item">
                <span>Email</span>
                <strong>
                  {patient.email || "Not provided"}
                </strong>
              </div>

              <div className="info-item">
                <span>Timezone</span>
                <strong>
                  {patient.timezone || "Asia/Kolkata"}
                </strong>
              </div>

              <div className="info-item">
                <span>Status</span>
                <strong>
                  {patient.active ? "Active" : "Inactive"}
                </strong>
              </div>

            </div>
          </section>

          {/* NUTRITION PLAN */}
          <section className="details-card">
            <div className="card-section-title">
              <span>NUTRITION</span>
            </div>

            <h2>Nutrition Plan</h2>

            {activePlan ? (
              <div className="nutrition-plan-preview">

                <div className="plan-icon">
                  📋
                </div>

                <div className="plan-info">
                  <h3>{activePlan.fileName}</h3>

                  <p>
                    Type:{" "}
                    {activePlan.fileType?.toUpperCase()}
                  </p>

                  <p>
                    Status:{" "}
                    <span className="plan-status">
                      Processed
                    </span>
                  </p>

                  {activePlan.uploadedAt && (
                    <p>
                      Uploaded:{" "}
                      {new Date(
                        activePlan.uploadedAt
                      ).toLocaleString()}
                    </p>
                  )}
                </div>

              </div>
            ) : (
              <div className="empty-state">

                <div className="empty-icon">
                  📋
                </div>

                <h3>No plan selected</h3>

                <p>
                  Upload a nutrition plan for this
                  patient to create their reminder
                  schedule.
                </p>

              </div>
            )}

            <button
              className="primary-button"
              onClick={() =>
                navigate(
                  `/patients/${patientId}/nutrition-plan`
                )
              }
            >
              + Upload Nutrition Plan
            </button>
          </section>

          {/* REMINDER SCHEDULE */}
          <section className="details-card schedule-card">

            <div className="card-section-title">
              <span>AUTOMATION</span>
            </div>

            <div className="schedule-heading-row">
              <h2>Reminder Schedule</h2>
              <button type="button" className="schedule-add-button" onClick={openCreateSchedule}>
                + Add Schedule
              </button>
            </div>

            {showCreateSchedule && (
              <div className="schedule-edit-panel schedule-create-panel">
                <h3>Add reminder schedule</h3>
                {scheduleCreateError && <p className="schedule-edit-error">{scheduleCreateError}</p>}
                <label>Time
                  <TimePicker value={scheduleCreateForm.time} onChange={(time) => setScheduleCreateForm((f) => ({ ...f, time }))} />
                </label>
                <label>Activity
                  <input value={scheduleCreateForm.activity} onChange={(e) => setScheduleCreateForm((f) => ({ ...f, activity: e.target.value }))} placeholder="e.g. Breakfast" />
                </label>
                <label>Message
                  <input value={scheduleCreateForm.message} onChange={(e) => setScheduleCreateForm((f) => ({ ...f, message: e.target.value }))} placeholder="Reminder message (optional)" />
                </label>
                <label>Start date
                  <input type="date" value={scheduleCreateForm.startDate} onChange={(e) => setScheduleCreateForm((f) => ({ ...f, startDate: e.target.value }))} />
                </label>
                <label>Duration (days)
                  <input type="number" min="1" step="1" value={scheduleCreateForm.durationDays} onChange={(e) => setScheduleCreateForm((f) => ({ ...f, durationDays: e.target.value }))} />
                </label>
                <label className="schedule-edit-check">
                  <input type="checkbox" checked={scheduleCreateForm.whatsappEnabled} onChange={(e) => setScheduleCreateForm((f) => ({ ...f, whatsappEnabled: e.target.checked }))} />
                  WhatsApp enabled
                </label>
                <div className="schedule-edit-actions">
                  <button type="button" disabled={scheduleCreateSaving} onClick={saveNewSchedule}>{scheduleCreateSaving ? "Saving..." : "Create schedule"}</button>
                  <button type="button" disabled={scheduleCreateSaving} onClick={() => { setShowCreateSchedule(false); setScheduleCreateError(""); }}>Cancel</button>
                </div>
              </div>
            )}

            {activeSchedules.length > 0 ? (
              <div className="schedule-list">

                {activeSchedules.map((schedule) => (<Fragment key={schedule._id}>
                  <div
                    className="schedule-row"
                    key={schedule._id}
                  >

                    <div className="schedule-time">
                      <span>◷</span>
                      <strong>{schedule.time}</strong>
                    </div>

                    <div className="schedule-content">
                      <strong>
                        {schedule.activity}
                      </strong>

                      <p>
                        {schedule.message}
                      </p>
                    </div>

                    <div className="schedule-actions">

                      {schedule.whatsappEnabled !== false && (
                        <span className="whatsapp-badge">
                          WhatsApp
                        </span>
                      )}
                      <button type="button" className="schedule-edit-button" onClick={() => beginScheduleEdit(schedule)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="schedule-delete-button"
                        onClick={() => handleScheduleDelete(schedule)}
                      >
                        Delete
                      </button>

                    </div>

                  </div>                    {editingScheduleId === schedule._id && (
                      <div className="schedule-edit-panel">
                        <h3>Edit reminder schedule</h3>
                        {scheduleEditError && <p className="schedule-edit-error">{scheduleEditError}</p>}
                        <label>Time
                          <TimePicker value={scheduleEditForm.time || "09:00 AM"} onChange={(time) => setScheduleEditForm((f) => ({ ...f, time }))} />
                        </label>
                        <label>Activity
                          <input value={scheduleEditForm.activity || ""} onChange={(e) => setScheduleEditForm((f) => ({ ...f, activity: e.target.value }))} />
                        </label>
                        <label>Message
                          <input value={scheduleEditForm.message || ""} onChange={(e) => setScheduleEditForm((f) => ({ ...f, message: e.target.value }))} />
                        </label>
                        <label>Start date
                          <input type="date" value={scheduleEditForm.startDate || ""} onChange={(e) => setScheduleEditForm((f) => ({ ...f, startDate: e.target.value }))} />
                        </label>
                        <label>Duration (days)
                          <input type="number" min="1" step="1" value={scheduleEditForm.durationDays ?? 5} onChange={(e) => setScheduleEditForm((f) => ({ ...f, durationDays: e.target.value }))} />
                        </label>
                        <label className="schedule-edit-check">
                          <input type="checkbox" checked={scheduleEditForm.whatsappEnabled !== false} onChange={(e) => setScheduleEditForm((f) => ({ ...f, whatsappEnabled: e.target.checked }))} />
                          WhatsApp enabled
                        </label>
                        <div className="schedule-edit-actions">
                          <button type="button" disabled={scheduleEditSaving} onClick={() => saveScheduleEdit(schedule._id)}>{scheduleEditSaving ? "Saving..." : "Save changes"}</button>
                          <button type="button" disabled={scheduleEditSaving} onClick={() => { setEditingScheduleId(null); setScheduleEditError(""); }}>Cancel</button>
                        </div>
                      </div>
                    )}
                </Fragment>))}

              </div>
            ) : (
              <div className="empty-state">

                <div className="empty-icon">
                  ◷
                </div>

                <h3>No active schedule</h3>

                <p>
                  The schedule will appear here after
                  a nutrition plan is confirmed.
                </p>

              </div>
            )}

          </section>

        </div>
      </main>
    </div>
  );
}

export default PatientDetails;


















