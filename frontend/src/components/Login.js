import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../services/authService";
import authService from "../services/authService";
import "./common.css";
import Navbar from "./Navbar";
import LoginImg from "../assets/3236267.jpg";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        throw new Error("Email and password are required");
      }

      if (!formData.password.trim()) {
        throw new Error("Password cannot be empty");
      }

      await login(formData.email, formData.password);

      const userData = authService.getCurrentUser();

      if (userData.role === ROLES.INSTRUCTOR) {
        navigate("/instructor-dashboard");
      } else {
        navigate("/student-dashboard");
      }
    } catch (err) {
      // Handle different types of errors
      if (
        err.message.includes("Wrong password") ||
        err.message.includes("User not found")
      ) {
        setError("Wrong email or password");
      } else if (err.message.includes("JSON")) {
        setError("Wrong email or password");
      } else {
        setError(
          err.message || "An error occurred during login. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      {/* Main Content with White Background */}
      <div className="bg-white min-vh-100 d-flex align-items-center justify-content-center font">
        <div className="container">
          <div className="row align-items-center">
            {/* Left Side - Illustrator */}
            <div className="col-md-7 mb-4 mb-md-0 text-center">
              <img
                src={LoginImg}
                alt="Login Illustration"
                className="img-fluid rounded"
                style={{ maxHeight: "550px" }}
              />
            </div>

            {/* Right Side - Login Form */}
            <div className="col-md-5 col-lg-5">
              <div>
                <div className="card-body p-4">
                  <h2
                    className="text-center mb-4 font-color"
                    style={{ fontWeight: "700" }}
                  >
                    Login in your learning platform
                  </h2>

                  {error && (
                    <div
                      className="alert alert-danger mb-4"
                      role="alert"
                      style={{
                        backgroundColor: "#fff3f3",
                        border: "1px solid #ffcdd2",
                        color: "#d32f2f",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <i className="bi bi-exclamation-circle-fill"></i>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="form-floating mb-3">
                      <input
                        type="email"
                        className="form-control custom-input no-focus-shadow"
                        id="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      <label htmlFor="email">Email</label>
                    </div>

                    <div className="form-floating mb-3 position-relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control custom-input no-focus-shadow"
                        id="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <label htmlFor="password">Password</label>
                      <button
                        type="button"
                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                        onClick={togglePasswordVisibility}
                        style={{ color: "#332D56", textDecoration: "none" }}
                      >
                        <i
                          className={`bi bi-eye${showPassword ? "-slash" : ""}`}
                        ></i>
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="login-btn w-100"
                      disabled={loading}
                    >
                      {loading ? "Logging in..." : "Login"}
                    </button>
                  </form>
                  <div className="text-center mt-3">
                    <p className="text-secondary">
                      Don't have an account?{" "}
                      <Link
                        to="/register"
                        className="text-decoration-none font-color"
                      >
                        Register here
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
