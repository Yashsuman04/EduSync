import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import authService, { ROLES } from "../services/authService";
import "./common.css";

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/landing");
  };

  const toggleNavbar = () => {
    setIsNavCollapsed(!isNavCollapsed);
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      if (user.role === ROLES.INSTRUCTOR) {
        navigate("/instructor-dashboard");
      } else {
        navigate("/student-dashboard");
      }
    } else {
      navigate("/landing");
    }
  };

  const handleResultClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      if (user.role === ROLES.INSTRUCTOR) {
        navigate("/instructor-results");
      } else {
        navigate("/all-results");
      }
    }
  };

  return (
    <nav className="navbar navbar-expand-lg bg-white border-secondary shadow font">
      <div className="container">
        <NavLink
          to="/"
          onClick={handleHomeClick}
          className="navbar-brand fw-bold"
          style={{ color: "#332D56", fontSize: "1.8rem" }}
        >
          EduSync
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleNavbar}
          aria-controls="navbarContent"
          aria-expanded={!isNavCollapsed}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className={`${isNavCollapsed ? "collapse" : ""} navbar-collapse`}
          id="navbarContent"
        >
          <ul
            className="navbar-nav me-auto mb-2 mb-lg-0"
            style={{ fontSize: "1.1rem" }}
          >
            {isAuthenticated && (
              <>
                <NavLink
                  className={({ isActive }) =>
                    `nav-link nav-item${
                      isActive ? "custom-outline fw-bold" : "custom-filled"
                    }`
                  }
                  onClick={handleHomeClick}
                >
                  Dashboard
                </NavLink>
                {user.role == ROLES.STUDENT && (
                  <NavLink
                    to="/available-courses"
                    className={({ isActive }) =>
                      `nav-item nav-link ${
                        isActive ? "fw-bold custom-outline" : "custom-filled"
                      }`
                    }
                  >
                    Courses
                  </NavLink>
                )}
                {/* <NavLink
                  to="/available-assessments"
                  className={({ isActive }) =>
                    `nav-item nav-link ${
                      isActive ? "fw-bold custom-outline" : "custom-filled"
                    }`
                  }
                >
                  Assessments
                </NavLink> */}
                <NavLink
                  className={({ isActive }) =>
                    `nav-item nav-link ${
                      isActive ? "fw-bold custom-outline" : "custom-filled"
                    }`
                  }
                  onClick={handleResultClick}
                >
                  Results
                </NavLink>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center">
            {isAuthenticated ? (
              <>
                <span
                  className="font-color me-3"
                  style={{ fontSize: "1.1rem" }}
                >
                  Welcome,{" "}
                  <span className="fw-bold font-color">{user?.name}</span>
                </span>
                <button onClick={handleLogout} className="custom-filled  ms-2">
                  Logout
                </button>
              </>
            ) : (
              <div className="d-flex gap-2">
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    isActive ? "custom-outline" : "custom-filled"
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    isActive ? "custom-outline" : "custom-filled"
                  }
                >
                  Register
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
