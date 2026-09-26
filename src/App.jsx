import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetails from "./pages/PatientDetails";
import NutritionPlanUpload from "./pages/NutritionPlanUpload";
import NutritionPlanPreview from "./pages/NutritionPlanPreview";
import NutritionPlans from "./pages/NutritionPlans";
import Schedule from "./pages/Schedule";
import ReminderHistory from "./pages/ReminderHistory";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <Patients />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patients/:patientId"
        element={
          <ProtectedRoute>
            <PatientDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patients/:patientId/nutrition-plan"
        element={
          <ProtectedRoute>
            <NutritionPlanUpload />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patients/:patientId/nutrition-plan/preview"
        element={
          <ProtectedRoute>
            <NutritionPlanPreview />
          </ProtectedRoute>
        }
      />

      <Route
        path="/nutrition-plans"
        element={
          <ProtectedRoute>
            <NutritionPlans />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reminder-history"
        element={
          <ProtectedRoute>
            <ReminderHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <Schedule />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;



