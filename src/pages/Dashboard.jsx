import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const admin = JSON.parse(
    localStorage.getItem("admin") || "null"
  );

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const patientsResponse = await api.get("/customers");

      const patientList = Array.isArray(
        patientsResponse.data
      )
        ? patientsResponse.data
        : patientsResponse.data?.customers || [];

      setPatients(patientList);

      const results = await Promise.all(
        patientList.map(async (patient) => {
          try {
            const [
              scheduleResponse,
              reminderResponse,
              planResponse
            ] = await Promise.all([
              api.get(
                `/schedules/customer/${patient._id}`
              ),
              api.get(
                `/reminders/customer/${patient._id}`
              ),
              api.get(
                `/nutrition-plans/customer/${patient._id}`
              )
            ]);

            const patientSchedules =
              Array.isArray(scheduleResponse.data)
                ? scheduleResponse.data
                : scheduleResponse.data?.schedules || [];

            const patientReminders =
              Array.isArray(reminderResponse.data)
                ? reminderResponse.data
                : reminderResponse.data?.reminders || [];

            const patientPlans =
              Array.isArray(planResponse.data)
                ? planResponse.data
                : planResponse.data?.plans || [];

            return {
              schedules: patientSchedules,
              reminders: patientReminders,
              plans: patientPlans
            };
          } catch (err) {
            console.error(
              `Failed to load data for patient ${patient._id}`,
              err
            );

            return {
              schedules: [],
              reminders: [],
              plans: []
            };
          }
        })
      );

      setSchedules(
        results.flatMap(
          (result) => result.schedules
        )
      );

      setReminders(
        results.flatMap(
          (result) => result.reminders
        )
      );

      setPlans(
        results.flatMap(
          (result) => result.plans
        )
      );
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
        "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  const activePatients = useMemo(
    () =>
      patients.filter(
        (patient) => patient.active
      ).length,
    [patients]
  );

  /*
   * Only CONFIRMED/PROCESSED nutrition plans
   * count as active plans.
   *
   * Uploaded plans are still waiting for admin
   * confirmation and therefore are not active.
   */
  const activePlans = useMemo(
    () =>
      plans.filter(
        (plan) =>
          plan.status === "processed"
      ).length,
    [plans]
  );

  /*
   * Use the browser's local date instead of
   * toISOString(), which can use UTC and cause
   * date mismatches around midnight.
   */
  const todayKey = useMemo(() => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  const todayReminders = useMemo(
    () =>
      reminders.filter(
        (reminder) =>
          reminder.dateKey === todayKey
      ),
    [reminders, todayKey]
  );

  const sentReminders = todayReminders.filter(
    (reminder) =>
      reminder.status === "sent"
  ).length;

  const failedReminders = todayReminders.filter(
    (reminder) =>
      reminder.status === "failed"
  ).length;

  /*
   * Today's schedule:
   * Only enabled schedules belonging to active
   * patients are displayed.
   *
   * Daily schedules are applicable every day.
   */
  const todaysSchedules = useMemo(
    () =>
      schedules.filter((schedule) => {
        const patient = patients.find(
          (item) =>
            String(item._id) ===
            String(
              schedule.customerId?._id ||
              schedule.customerId
            )
        );

        return (
          schedule.enabled !== false &&
          patient?.active !== false
        );
      }),
    [schedules, patients]
  );

  const sortedSchedules = useMemo(() => {
    const convert = (time) => {
      const match = String(time)
        .trim()
        .toUpperCase()
        .match(
          /^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/
        );

      if (!match) {
        return Number.MAX_SAFE_INTEGER;
      }

      let hour = Number(match[1]);
      const minute = Number(
        match[2] || 0
      );
      const period = match[3];

      if (
        period === "AM" &&
        hour === 12
      ) {
        hour = 0;
      }

      if (
        period === "PM" &&
        hour !== 12
      ) {
        hour += 12;
      }

      return hour * 60 + minute;
    };

    return [...todaysSchedules].sort(
      (a, b) =>
        convert(a.time) -
        convert(b.time)
    );
  }, [todaysSchedules]);

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            ✚
          </div>

          <div>
            <h2>Holistic Healthnook</h2>
            <span>Automation</span>
          </div>
        </div>

        <nav className="sidebar-nav">

          <button
            className="nav-item active"
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/patients")
            }
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

          <button
            className="nav-item"
          >
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

      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>

            <p className="eyebrow">
              ADMIN PORTAL
            </p>

            <h1>
              Dashboard
            </h1>

            <p className="header-description">
              Manage patients, nutrition plans
              and automated reminders.
            </p>

          </div>

          <div className="header-user">

            <div className="header-avatar">
              {(admin?.name || "A")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {admin?.name || "Admin"}
              </strong>

              <span>
                Administrator
              </span>
            </div>

          </div>

        </header>

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon patients-icon">
              ♙
            </div>

            <div>
              <span>
                Total Patients
              </span>

              <strong>
                {patients.length}
              </strong>

              <small>
                {activePatients} active
              </small>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon plans-icon">
              ▤
            </div>

            <div>
              <span>
                Active Plans
              </span>

              <strong>
                {activePlans}
              </strong>

              <small>
                Confirmed nutrition plans
              </small>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon reminder-icon">
              ◷
            </div>

            <div>
              <span>
                Today's Reminders
              </span>

              <strong>
                {todayReminders.length}
              </strong>

              <small>
                Triggered today
              </small>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon sent-icon">
              ✓
            </div>

            <div>
              <span>
                WhatsApp Sent
              </span>

              <strong>
                {sentReminders}
              </strong>

              <small>
                {failedReminders} failed
              </small>
            </div>

          </div>

        </section>

        <section className="content-grid">

          <div className="panel schedule-panel">

            <div className="panel-header">

              <div>
                <h2>
                  Today's Schedule
                </h2>

                <p>
                  Active nutrition activities
                </p>
              </div>

              <span className="count-badge">
                {sortedSchedules.length}
              </span>

            </div>

            {sortedSchedules.length === 0 ? (

              <div className="empty-state">
                <div>◷</div>
                <p>
                  No schedules available.
                </p>
              </div>

            ) : (

              <div className="schedule-list">

                {sortedSchedules.map(
                  (schedule) => (

                    <div
                      className="schedule-row"
                      key={schedule._id}
                    >

                      <div className="schedule-time">
                        {schedule.time}
                      </div>

                      <div className="schedule-line"></div>

                      <div className="schedule-info">

                        <strong>
                          {schedule.activity}
                        </strong>

                        <span>
                          {schedule.message}
                        </span>

                      </div>

                      <div
                        className={
                          schedule.enabled
                            ? "status active-status"
                            : "status inactive-status"
                        }
                      >
                        {schedule.enabled
                          ? "Active"
                          : "Disabled"}
                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

          <div className="panel patients-panel">

            <div className="panel-header">

              <div>
                <h2>
                  Patients
                </h2>

                <p>
                  Recently added patients
                </p>
              </div>

              <span className="count-badge">
                {patients.length}
              </span>

            </div>

            {patients.length === 0 ? (

              <div className="empty-state">
                <div>♙</div>
                <p>
                  No patients found.
                </p>
              </div>

            ) : (

              <div className="patient-list">

                {patients
                  .slice(0, 6)
                  .map((patient) => (

                    <div
                      className="patient-row"
                      key={patient._id}
                    >

                      <div className="patient-avatar">
                        {patient.name
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="patient-info">

                        <strong>
                          {patient.name}
                        </strong>

                        <span>
                          {patient.whatsappNumber ||
                            patient.phone}
                        </span>

                      </div>

                      <div
                        className={
                          patient.active
                            ? "patient-status active"
                            : "patient-status"
                        }
                      >
                        {patient.active
                          ? "Active"
                          : "Inactive"}
                      </div>

                    </div>

                  ))}

              </div>

            )}

          </div>

        </section>

        <section className="panel reminder-panel">

          <div className="panel-header">

            <div>
              <h2>
                Reminder Activity
              </h2>

              <p>
                Latest automated reminder events
              </p>
            </div>

            <span className="count-badge">
              {reminders.length}
            </span>

          </div>

          {reminders.length === 0 ? (

            <div className="empty-state">
              <div>✓</div>
              <p>
                No reminder activity yet.
              </p>
            </div>

          ) : (

            <div className="reminder-table-wrapper">

              <table className="reminder-table">

                <thead>

                  <tr>
                    <th>Patient</th>
                    <th>Activity</th>
                    <th>Scheduled</th>
                    <th>Status</th>
                  </tr>

                </thead>

                <tbody>

                  {reminders
                    .slice(0, 8)
                    .map((reminder) => {

                      const patient =
                        patients.find(
                          (item) =>
                            String(item._id) ===
                            String(
                              reminder.customerId?._id ||
                              reminder.customerId
                            )
                        );

                      return (
                        <tr
                          key={reminder._id}
                        >

                          <td>
                            <strong>
                              {patient?.name ||
                                "Patient"}
                            </strong>
                          </td>

                          <td>
                            {reminder.scheduleId
                              ?.activity ||
                              "Reminder"}
                          </td>

                          <td>
                            {reminder.scheduleId
                              ?.time ||
                              "-"}
                          </td>

                          <td>

                            <span
                              className={`reminder-status ${reminder.status}`}
                            >
                              {reminder.status}
                            </span>

                          </td>

                        </tr>
                      );

                    })}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default Dashboard;
