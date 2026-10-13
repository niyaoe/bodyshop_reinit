import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bs-login-page">
      <div className="bs-login-card">
        <div className="bs-login-header">
          <div className="bs-login-brand">
            <img
              src="/ERAM MOTORS Upscaled.png"
              alt="Body Shop Tracker logo"
              className="bs-login-logo"
            />

            <h1 className="bs-login-title">
              Body Shop <span>Tracker</span>
            </h1>
          </div>

          {/* <p className="bs-login-subtitle">
            Sign in to continue to your workspace
          </p> */}
        </div>

        <form className="bs-login-form" onSubmit={handleLogin}>
          {error && <div className="bs-login-error">{error}</div>}

          <div className="bs-login-field">
            <label className="bs-login-label">Email</label>

            <input
              type="email"
              className="bs-login-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="bs-login-field">
            <label className="bs-login-label" htmlFor="login-password">
              Password
            </label>

            <div className="bs-login-password-wrapper">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="bs-login-input bs-login-password-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="bs-login-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3l18 18M10.6 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a15 15 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1.5 0 2.8-.4 4-1" />
                    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="bs-login-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
