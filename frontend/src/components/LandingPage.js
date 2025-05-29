import React, { useEffect, useRef } from "react";
import Typed from "typed.js";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "./Navbar";

export default function LandingPage() {
  const typedRef = useRef(null);

  useEffect(() => {
    const typed = new Typed(typedRef.current, {
      strings: ["courses", "quizzes", "your academic growth"],
      typeSpeed: 90,
      backSpeed: 30,
      loop: true,
    });

    return () => {
      typed.destroy();
    };
  }, []);

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ backgroundColor: "#fff" }}
    >
      <Navbar />

      <main className="flex-grow-1 d-flex align-items-center justify-content-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="d-flex flex-row align-items-center justify-content-between container "
          style={{
            height: "80vh",
            width: "100vw",
            backgroundColor: "FFF",
            borderRadius: "50px",
            padding: "1rem",
            color: "#332D56",
            overflow: "hidden",
          }}
        >
          {/* Left Side - Text */}
          <div className="w-50 pe-4 d-flex flex-column justify-content-center font">
            <h1 className="fw-bold mb-3" style={{ fontSize: "60px" }}>
              Welcome to the learning platform <br />
              <span style={{ color: "#4E6688", fontSize: "100px" }}>
                EduSync
              </span>
            </h1>
            <p
              className="mb-4 fw-bold"
              style={{ fontSize: "23px", fontWeight: "500" }}
            >
              Your personalized platform for managing{" "}
              <span ref={typedRef}></span>
            </p>
            <Link
              to="/register"
              className="custom-filled"
              style={{ color: "332D56" }}
            >
              Explore Now
            </Link>
          </div>

          {/* Right Side - Illustration */}
          <div className="w-50 ps-4 d-flex align-items-center justify-content-center">
            <img
              src="https://img.freepik.com/free-vector/male-teacher-with-chalkboard_24908-81246.jpg?uid=R93806176&ga=GA1.1.2072315186.1747676373&semt=ais_hybrid&w=740" // replace with your actual path
              alt="Edu illustration"
              className="img-fluid"
              style={{ maxHeight: "85%", maxWidth: "100%" }}
            />
          </div>
        </motion.div>
      </main>

      <footer
        className="text-center py-3"
        style={{ backgroundColor: "#fff", color: "#4E6688" }}
      >
        <small>&copy; 2025 EduSync. All rights reserved.</small>
      </footer>
    </div>
  );
}
