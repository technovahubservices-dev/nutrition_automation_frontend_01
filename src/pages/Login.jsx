import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email,
        password
      });

      localStorage.setItem(
        "adminToken",
        response.data.token
      );

      localStorage.setItem(
        "admin",
        JSON.stringify(response.data.admin)
      );

      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-header">
          <div className="login-icon">🩺</div>

          <h1>Nutrition Automation</h1>

          <p>
            Admin Portal
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="admin@nutrition.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        <div className="login-footer">
          Authorized nutritionist / doctor access only
        </div>

      </div>
    </div>
  );
}

export default Login;
