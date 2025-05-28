import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const AvailabeAssessment = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const handleDeleteAssessment = async (assessmentId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `http://localhost:7197/api/Assessments/${assessmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete assessment");
      }

      setAssessments(
        assessments.filter(
          (assessment) => assessment.assessmentId !== assessmentId
        )
      );
    } catch (err) {
      console.error("Error deleting assessment:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        // Fetch course details
        const courseResponse = await fetch(
          `http://localhost:7197/api/Courses/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!courseResponse.ok) {
          throw new Error("Failed to fetch course details");
        }

        const courseData = await courseResponse.json();
        setCourse(courseData);

        // Fetch assessments for the course
        const assessmentsResponse = await fetch(
          `http://localhost:7197/api/Assessments/course/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!assessmentsResponse.ok) {
          throw new Error("Failed to fetch assessments");
        }

        const assessmentsData = await assessmentsResponse.json();
        setAssessments(
          Array.isArray(assessmentsData)
            ? assessmentsData
            : assessmentsData.$values && Array.isArray(assessmentsData.$values)
            ? assessmentsData.$values
            : []
        );
      } catch (err) {
        console.error("Error fetching course details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  const handleDownload = (fileKey) => {
    const fileData = localStorage.getItem(fileKey);
    if (fileData) {
      const link = document.createElement("a");
      link.href = fileData;
      link.download = course.localFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 bg-black text-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5 bg-black text-light">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <h3 className="card-title md-4 mb-4">Assessments</h3>
      {assessments.length > 0 ? (
        <div className="row">
          {assessments.map((assessment) => (
            <div key={assessment.assessmentId} className="col-md-4 mb-4">
              <div className="card bg-white font-color h-100">
                <div className="card-body">
                  <h5 className="card-title bold">{assessment.title}</h5>
                  <div className="mb-3">
                    <span className="custom-outline-filled me-2">
                      <i className="bi bi-question-circle me-1"></i>
                      {assessment.questionCount} Questions
                    </span>
                    <span className="custom-outline-filled">
                      <i className="bi bi-star me-1"></i>
                      Max Score: {assessment.maxScore}
                    </span>
                  </div>
                  <p className="card-text text-muted">
                    Test your knowledge and understanding of the course
                    material.
                  </p>
                </div>
                <div className="card-footer border-top-0">
                  {user?.role === "Instructor" ? (
                    <div className="d-flex gap-5">
                      <Link
                        to={`/edit-assessment/${assessment.assessmentId}`}
                        className="custom-outline-filled "
                      >
                        <i className="bi bi-pencil me-2"></i>
                        Edit Assessment
                      </Link>
                      <button
                        className="custom-outline-filled"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this assessment?"
                            )
                          ) {
                            handleDeleteAssessment(assessment.assessmentId);
                          }
                        }}
                      >
                        <i className="bi bi-trash me-2"></i>
                        Delete
                      </button>
                    </div>
                  ) : (
                    <Link
                      to={`/assessment/${assessment.assessmentId}`}
                      className="custom-filled w-100"
                    >
                      <i className="bi bi-pencil-square me-2"></i>
                      Take Assessment
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          No assessments available for this course yet.
        </div>
      )}
    </div>
  );
};

export default AvailabeAssessment;
