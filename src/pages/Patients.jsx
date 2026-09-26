import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./Patients.css";

function Patients() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    whatsappNumber: "",
    timezone: "Asia/Kolkata",
    active: true
  });

  const admin = JSON.parse(
    localStorage.getItem("admin") || "null"
  );

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers");

      setPatients(response.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        return;
      }

      setError(
        err.response?.data?.message ||
        "Failed to load patients"
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      whatsappNumber: "",
      timezone: "Asia/Kolkata",
      active: true
    });

    setEditingPatient(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (patient) => {
    setEditingPatient(patient);

    setForm({
      name: patient.name || "",
      phone: patient.phone || "",
      email: patient.email || "",
      whatsappNumber:
        patient.whatsappNumber || "",
      timezone:
        patient.timezone || "Asia/Kolkata",
      active: patient.active !== false
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");

      if (editingPatient) {
        await api.put(
          `/customers/${editingPatient._id}`,
          form
        );
      } else {
        await api.post(
          "/customers",
          form
        );
      }

      closeForm();
      await loadPatients();
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        return;
      }

      setError(
        err.response?.data?.message ||
        "Failed to save patient"
      );
    }
  };

  const handleDelete = async (patient) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${patient.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/customers/${patient._id}`
      );

      await loadPatients();
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        return;
      }

      setError(
        err.response?.data?.message ||
        "Failed to delete patient"
      );
    }
  };

  const filteredPatients = patients.filter(
    (patient) => {
      const searchValue =
        search.toLowerCase().trim();

      if (!searchValue) {
        return true;
      }

      return (
        patient.name
          ?.toLowerCase()
          .includes(searchValue) ||
        patient.phone
          ?.toLowerCase()
          .includes(searchValue) ||
        patient.email
          ?.toLowerCase()
          .includes(searchValue) ||
        patient.whatsappNumber
          ?.toLowerCase()
          .includes(searchValue)
      );
    }
  );

  return (
    <div className="dashboard-shell">

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            ✚
          </div>

          <div>
            <h2>NutriCare</h2>
            <span>Automation</span>
          </div>

        </div>

        <nav className="sidebar-nav">

          <button
            className="nav-item"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="nav-item active"
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

      <main className="patients-main">

        <header className="page-header">

          <div>

            <p className="page-eyebrow">
              PATIENT MANAGEMENT
            </p>

            <h1>Patients</h1>

            <p className="page-description">
              Manage patient information and
              nutrition plans.
            </p>

          </div>

          <button
            className="add-patient-button"
            onClick={openAddForm}
          >
            + Add Patient
          </button>

        </header>

        {error && (
          <div className="patients-error">
            {error}
          </div>
        )}

        <section className="patients-card">

          <div className="patients-toolbar">

            <div>
              <h2>
                All Patients
              </h2>

              <span>
                {filteredPatients.length} patient
                {filteredPatients.length !== 1
                  ? "s"
                  : ""}
              </span>
            </div>

            <div className="search-box">

              <span>⌕</span>

              <input
                type="text"
                placeholder="Search patients..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>

          </div>

          {loading ? (

            <div className="patients-loading">
              <div className="patients-spinner"></div>
              <p>Loading patients...</p>
            </div>

          ) : filteredPatients.length === 0 ? (

            <div className="patients-empty">

              <div className="empty-patient-icon">
                ♙
              </div>

              <h3>
                No patients found
              </h3>

              <p>
                {search
                  ? "Try a different search."
                  : "Add your first patient to get started."}
              </p>

              {!search && (
                <button
                  onClick={openAddForm}
                  className="empty-add-button"
                >
                  + Add Patient
                </button>
              )}

            </div>

          ) : (

            <div className="patients-table-wrapper">

              <table className="patients-table">

                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Phone</th>
                    <th>WhatsApp</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredPatients.map(
                    (patient) => (

                      <tr key={patient._id}>

                        <td>

                          <div className="patient-cell">

                            <div className="patient-table-avatar">
                              {patient.name
                                ?.charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {patient.name}
                              </strong>

                              <span>
                                {patient.timezone ||
                                  "Asia/Kolkata"}
                              </span>
                            </div>

                          </div>

                        </td>

                        <td>
                          {patient.phone || "-"}
                        </td>

                        <td>
                          {patient.whatsappNumber ||
                            "-"}
                        </td>

                        <td>
                          {patient.email || "-"}
                        </td>

                        <td>

                          <span
                            className={
                              patient.active
                                ? "patient-active"
                                : "patient-inactive"
                            }
                          >
                            {patient.active
                              ? "Active"
                              : "Inactive"}
                          </span>

                        </td>

                        <td>

                          <div className="patient-actions">

                            <button
                              className="view-button"
                              onClick={() =>
                                navigate(
                                  `/patients/${patient._id}`
                                )
                              }
                            >
                              View
                            </button>

                            <button
                              className="edit-button"
                              onClick={() =>
                                openEditForm(
                                  patient
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                handleDelete(
                                  patient
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

          )}

        </section>

      </main>

      {showForm && (

        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >

          <div className="patient-modal">

            <div className="modal-header">

              <div>
                <p className="modal-eyebrow">
                  PATIENT
                </p>

                <h2>
                  {editingPatient
                    ? "Edit Patient"
                    : "Add Patient"}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={closeForm}
              >
                ×
              </button>

            </div>

            <form
              className="patient-form"
              onSubmit={handleSubmit}
            >

              <div className="form-grid">

                <div className="field">
                  <label>
                    Patient Name *
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter patient name"
                    required
                  />
                </div>

                <div className="field">
                  <label>
                    Phone *
                  </label>

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="field">
                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="patient@example.com"
                  />
                </div>

                <div className="field">
                  <label>
                    WhatsApp Number *
                  </label>

                  <input
                    name="whatsappNumber"
                    value={form.whatsappNumber}
                    onChange={handleChange}
                    placeholder="919876543210"
                    required
                  />
                </div>

                <div className="field full-width">
                  <label>
                    Timezone
                  </label>

                  <select
                    name="timezone"
                    value={form.timezone}
                    onChange={handleChange}
                  >
                    <option value="Asia/Kolkata">
                      India — Asia/Kolkata
                    </option>

                    <option value="Asia/Dubai">
                      UAE — Asia/Dubai
                    </option>

                    <option value="Asia/Singapore">
                      Singapore — Asia/Singapore
                    </option>

                    <option value="Europe/London">
                      UK — Europe/London
                    </option>

                    <option value="America/New_York">
                      USA — America/New_York
                    </option>
                  </select>
                </div>

                <div className="active-field full-width">

                  <label className="toggle-label">

                    <input
                      type="checkbox"
                      name="active"
                      checked={form.active}
                      onChange={handleChange}
                    />

                    <span className="toggle"></span>

                    <span>
                      Patient is active
                    </span>

                  </label>

                </div>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-patient-button"
                >
                  {editingPatient
                    ? "Save Changes"
                    : "Create Patient"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Patients;



