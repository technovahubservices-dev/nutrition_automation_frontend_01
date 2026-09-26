import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import "./NutritionPlanPreview.css";

function NutritionPlanPreview() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const plan = location.state?.plan;
  const initialPreview = location.state?.preview || [];

  const [schedules, setSchedules] = useState(
    initialPreview.map((item) => ({
      time: item.time || "",
      activity: item.activity || "",
      message: item.message || "",
      repeat: "daily",
      whatsappEnabled: true,
      enabled: true
    }))
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateRow = (index, field, value) => {
    setSchedules((previous) =>
      previous.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: value
            }
          : row
      )
    );
  };

  const addRow = () => {
    setSchedules((previous) => [
      ...previous,
      {
        time: "",
        activity: "",
        message: "",
        repeat: "daily",
        whatsappEnabled: true,
        enabled: true
      }
    ]);
  };

  const removeRow = (index) => {
    setSchedules((previous) =>
      previous.filter(
        (_, rowIndex) => rowIndex !== index
      )
    );
  };

  const handleConfirm = async () => {
    if (!plan?._id) {
      setError(
        "Nutrition plan information is missing. Please upload the file again."
      );
      return;
    }

    if (!schedules.length) {
      setError(
        "At least one schedule entry is required."
      );
      return;
    }

    const invalidRow = schedules.find(
      (row) =>
        !row.time.trim() ||
        !row.activity.trim()
    );

    if (invalidRow) {
      setError(
        "Every schedule row must have a time and activity."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post(
        `/nutrition-plans/${plan._id}/confirm`,
        {
          schedules
        }
      );

      navigate(`/patients/${patientId}`);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
        navigate("/login");
        return;
      }

      setError(
        err.response?.data?.message ||
        "Failed to activate nutrition plan."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <div className="nutrition-preview-page">
        <div className="preview-error-card">
          <h2>Preview unavailable</h2>

          <p>
            The uploaded nutrition plan preview
            is no longer available on this page.
          </p>

          <button
            onClick={() =>
              navigate(
                `/patients/${patientId}/nutrition-plan`
              )
            }
          >
            Upload Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="nutrition-preview-page">

      <header className="preview-header">

        <button
          className="preview-back-button"
          onClick={() =>
            navigate(`/patients/${patientId}`)
          }
        >
          ← Back to Patient
        </button>

        <p className="preview-eyebrow">
          REVIEW & VERIFY
        </p>

        <h1>
          Nutrition Schedule Preview
        </h1>

        <p className="preview-description">
          Review the schedule extracted from the
          uploaded plan. You can edit, add or
          remove entries before activation.
        </p>

      </header>

      <section className="plan-summary">

        <div>
          <span>FILE</span>
          <strong>{plan.fileName}</strong>
        </div>

        <div>
          <span>TYPE</span>
          <strong>
            {plan.fileType.toUpperCase()}
          </strong>
        </div>

        <div>
          <span>ENTRIES</span>
          <strong>{schedules.length}</strong>
        </div>

      </section>

      {error && (
        <div className="preview-error">
          {error}
        </div>
      )}

      <section className="preview-card">

        <div className="preview-card-header">

          <div>
            <p className="preview-card-eyebrow">
              EXTRACTED SCHEDULE
            </p>

            <h2>
              Verify Before Activation
            </h2>
          </div>

          <button
            className="add-schedule-button"
            onClick={addRow}
          >
            + Add Schedule
          </button>

        </div>

        <div className="schedule-table-wrapper">

          <table className="preview-table">

            <thead>
              <tr>
                <th>Time</th>
                <th>Activity</th>
                <th>Message</th>
                <th>Repeat</th>
                <th>WhatsApp</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {schedules.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="empty-preview"
                  >
                    No schedule entries.
                    Click "Add Schedule" to add one.
                  </td>
                </tr>
              ) : (
                schedules.map(
                  (row, index) => (
                    <tr key={index}>

                      <td>
                        <input
                          value={row.time}
                          onChange={(event) =>
                            updateRow(
                              index,
                              "time",
                              event.target.value
                            )
                          }
                          placeholder="08:00 AM"
                        />
                      </td>

                      <td>
                        <input
                          value={row.activity}
                          onChange={(event) =>
                            updateRow(
                              index,
                              "activity",
                              event.target.value
                            )
                          }
                          placeholder="Breakfast"
                        />
                      </td>

                      <td>
                        <input
                          value={row.message}
                          onChange={(event) =>
                            updateRow(
                              index,
                              "message",
                              event.target.value
                            )
                          }
                          placeholder="Have breakfast"
                        />
                      </td>

                      <td>
                        <select
                          value={row.repeat}
                          onChange={(event) =>
                            updateRow(
                              index,
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
                      </td>

                      <td>
                        <label className="whatsapp-toggle">
                          <input
                            type="checkbox"
                            checked={
                              row.whatsappEnabled
                            }
                            onChange={(event) =>
                              updateRow(
                                index,
                                "whatsappEnabled",
                                event.target.checked
                              )
                            }
                          />

                          <span>
                            {row.whatsappEnabled
                              ? "On"
                              : "Off"}
                          </span>
                        </label>
                      </td>

                      <td>
                        <button
                          className="remove-row-button"
                          onClick={() =>
                            removeRow(index)
                          }
                        >
                          Remove
                        </button>
                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </section>

      <div className="preview-footer">

        <div>
          <strong>
            Nothing is active yet.
          </strong>

          <p>
            Schedules will only start being used
            by the reminder system after you confirm.
          </p>
        </div>

        <div className="preview-footer-actions">

          <button
            className="preview-cancel-button"
            onClick={() =>
              navigate(`/patients/${patientId}`)
            }
          >
            Cancel
          </button>

          <button
            className="confirm-plan-button"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading
              ? "Activating..."
              : "✓ Confirm & Activate"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default NutritionPlanPreview;
