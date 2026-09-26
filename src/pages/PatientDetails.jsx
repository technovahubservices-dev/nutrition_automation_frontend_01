import { useEffect, useState } from "react";
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

function PatientDetails() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [plans, setPlans] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

            <h2>Reminder Schedule</h2>

            {activeSchedules.length > 0 ? (
              <div className="schedule-list">

                {activeSchedules.map((schedule) => (
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

                      <span className="repeat-badge">
                        {schedule.repeat === "once"
                          ? "Once"
                          : "Daily"}
                      </span>

                      {schedule.whatsappEnabled !== false && (
                        <span className="whatsapp-badge">
                          WhatsApp
                        </span>
                      )}

                    </div>

                  </div>
                ))}

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




