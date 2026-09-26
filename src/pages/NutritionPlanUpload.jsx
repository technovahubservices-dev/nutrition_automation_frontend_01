import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import "./NutritionPlanUpload.css";

function NutritionPlanUpload() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return false;
    }

    const allowedExtensions = [
      ".xlsx",
      ".xls",
      ".csv",
      ".pdf"
    ];

    const fileName =
      selectedFile.name.toLowerCase();

    return allowedExtensions.some(
      (extension) =>
        fileName.endsWith(extension)
    );
  };

  const selectFile = (selectedFile) => {
    setError("");

    if (!selectedFile) {
      return;
    }

    if (!validateFile(selectedFile)) {
      setFile(null);
      setError(
        "Please select an XLSX, XLS, CSV or PDF file."
      );
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (event) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    const droppedFile =
      event.dataTransfer.files?.[0];

    selectFile(droppedFile);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      setError(
        "Please select a nutrition plan file."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();

      formData.append("file", file);
      formData.append("customerId", patientId);

      const response = await api.post(
        "/nutrition-plans/upload",
        formData
      );

      const planId =
        response.data?.plan?._id;

      if (!planId) {
        throw new Error(
          "Nutrition plan was uploaded but no plan ID was returned."
        );
      }

      navigate(
        `/patients/${patientId}/nutrition-plan/preview`,
        {
          state: {
            plan: response.data.plan,
            preview:
              response.data.preview || []
          }
        }
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
        err.message ||
        "Failed to upload nutrition plan."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nutrition-upload-page">

      <header className="nutrition-upload-header">

        <button
          className="upload-back-button"
          type="button"
          onClick={() =>
            navigate(`/patients/${patientId}`)
          }
        >
          ← Back to Patient
        </button>

        <p className="upload-eyebrow">
          NUTRITION PLAN
        </p>

        <h1>
          Upload Nutrition Plan
        </h1>

        <p className="upload-description">
          Upload the patient's nutrition plan.
          The system will extract the schedule
          for your review before activation.
        </p>

      </header>

      <section className="upload-card">

        <form onSubmit={handleUpload}>

          <div
            className={`upload-drop-zone ${
              isDragging
                ? "upload-drop-zone-dragging"
                : ""
            }`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >

            <div className="upload-file-icon">
              ↑
            </div>

            <h2>
              Drag & Drop Nutrition Plan
            </h2>

            <p>
              Drop your Excel, CSV or PDF file here
            </p>

            <span className="upload-or">
              or
            </span>

            <label className="choose-file-button">
              Choose File

              <input
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                onChange={handleFileChange}
                hidden
              />
            </label>

            <small className="upload-supported">
              Supported: .xlsx, .xls, .csv, .pdf
            </small>

            {file && (
              <div className="selected-file">

                <div>
                  <strong>
                    {file.name}
                  </strong>

                  <span>
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>

                <button
                  type="button"
                  className="remove-file-button"
                  onClick={() => {
                    setFile(null);
                    setError("");
                  }}
                >
                  ×
                </button>

              </div>
            )}

          </div>

          {error && (
            <div className="upload-error">
              {error}
            </div>
          )}

          <div className="upload-info">

            <strong>
              What happens next?
            </strong>

            <p>
              The file will be parsed and the
              extracted schedule will be shown
              for verification. Nothing is activated
              until you confirm it.
            </p>

          </div>

          <div className="upload-actions">

            <button
              type="button"
              className="upload-cancel-button"
              onClick={() =>
                navigate(`/patients/${patientId}`)
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="upload-submit-button"
              disabled={!file || loading}
            >
              {loading
                ? "Uploading & Parsing..."
                : "Upload & Parse"}
            </button>

          </div>

        </form>

      </section>

    </div>
  );
}

export default NutritionPlanUpload;
