import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../services/authService";
import Navbar from "./Navbar";
import RegisterImg from "../assets/3236267.jpg"; // Use the same image or add a new one

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: ROLES.STUDENT,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

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
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );
      navigate(
        formData.role === ROLES.INSTRUCTOR
          ? "/instructor-dashboard"
          : "/student-dashboard"
      );
    } catch (err) {
      // Handle different types of errors
      if (err.message.includes("User already exists")) {
        setError("An account with this email already exists");
      } else if (err.message.includes("JSON")) {
        setError("Registration failed. Please try again.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
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
            {/* Left Side - Illustration */}
            <div className="col-md-7 mb-4 mb-md-0 text-center">
              <img
                src={RegisterImg}
                alt="Register Illustration"
                className="img-fluid rounded"
                style={{ maxHeight: "550px" }}
              />
            </div>

            {/* Right Side - Registration Form */}
            <div className="col-md-5 col-lg-5">
              <div className="card-body p-4">
                <h2
                  className="text-center mb-4 font-color"
                  style={{ color: "#332D56", fontWeight: "700" }}
                >
                  Register on your learning platform
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
                      type="text"
                      className="form-control custom-input no-focus-shadow"
                      id="name"
                      name="name"
                      placeholder="Name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      style={{ color: "#332D56" }}
                    />
                    <label htmlFor="name" style={{ color: "#332D56" }}>
                      Name
                    </label>
                  </div>

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
                      style={{ color: "#332D56" }}
                    />
                    <label htmlFor="email" style={{ color: "#332D56" }}>
                      Email
                    </label>
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
                      style={{ color: "#332D56" }}
                    />
                    <label htmlFor="password" style={{ color: "#332D56" }}>
                      Password
                    </label>
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

                  <div className="form-floating mb-4">
                    <select
                      className="form-select custom-input no-focus-shadow"
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                      style={{ color: "#332D56" }}
                    >
                      <option value={ROLES.STUDENT}>Student</option>
                      <option value={ROLES.INSTRUCTOR}>Instructor</option>
                    </select>
                    <label htmlFor="role" style={{ color: "#332D56" }}>
                      Role
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="register-btn w-100"
                    disabled={loading}
                  >
                    {loading ? "Registering..." : "Register"}
                  </button>
                </form>

                <div className="text-center mt-3">
                  <p className="text-secondary">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-decoration-none font-color"
                    >
                      Login here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
