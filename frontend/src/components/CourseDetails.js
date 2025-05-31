import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import AvailabeAssessment from "./AvailableAssessments";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [assessmentAttempts, setAssessmentAttempts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [previewSasUrl, setPreviewSasUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState(null);

  const handleDeleteClick = (assessmentId) => {
    setAssessmentToDelete(assessmentId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `http://localhost:7197/api/Assessments/${assessmentToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.message || errorData.error || "Failed to delete assessment";
        const detailedError = errorData.innerError
          ? `\nDetails: ${errorData.innerError}`
          : "";
        throw new Error(`${errorMessage}${detailedError}`);
      }

      setAssessments(
        assessments.filter(
          (assessment) => assessment.assessmentId !== assessmentToDelete
        )
      );
      setShowDeleteModal(false);
      setAssessmentToDelete(null);
    } catch (err) {
      console.error("Error deleting assessment:", err);
      setError(err.message);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAssessmentToDelete(null);
  };

  const handleMaterialDownload = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      if (!course.materialFileName)
        throw new Error("No study material available");
      const response = await fetch(
        `http://localhost:7197/api/file/sas/${encodeURIComponent(
          course.materialFileName
        )}`
      );
      if (!response.ok) throw new Error("Failed to get download link");
      const data = await response.json();
      console.log("SAS URL response:", data);
      window.open(data.sasUrl, "_blank");
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setDownloading(false);
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
        console.log("Fetched course data:", courseData);
        console.log("Material file name:", courseData.materialFileName);
        setCourse(courseData);

        // Fetch SAS URL for preview if materialFileName exists and is PDF
        if (
          courseData.materialFileName &&
          courseData.materialFileName.toLowerCase().endsWith(".pdf")
        ) {
          try {
            console.log("Fetching SAS URL for preview...");
            const sasRes = await fetch(
              `http://localhost:7197/api/file/sas/${encodeURIComponent(
                courseData.materialFileName
              )}`
            );
            if (sasRes.ok) {
              const sasData = await sasRes.json();
              console.log("SAS URL response:", sasData);
              setPreviewSasUrl(sasData.sasUrl);
            } else {
              console.error(
                "Failed to fetch SAS URL:",
                sasRes.status,
                sasRes.statusText
              );
              setPreviewSasUrl("");
            }
          } catch (err) {
            console.error("Error fetching SAS URL:", err);
            setPreviewSasUrl("");
          }
        } else {
          setPreviewSasUrl("");
        }

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
        const processedAssessments = Array.isArray(assessmentsData)
          ? assessmentsData
          : assessmentsData.$values && Array.isArray(assessmentsData.$values)
          ? assessmentsData.$values
          : [];

        setAssessments(processedAssessments);

        // Fetch assessment attempts for each assessment
        const attempts = {};
        for (const assessment of processedAssessments) {
          try {
            const resultsResponse = await fetch(
              `http://localhost:7197/api/Results/student/${user.userId}/assessment/${assessment.assessmentId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (resultsResponse.status === 404) {
              // If no results found, set attempts to 0 and continue
              attempts[assessment.assessmentId] = 0;
              continue;
            }

            if (!resultsResponse.ok) {
              throw new Error(
                `Failed to fetch results: ${resultsResponse.status}`
              );
            }

            const results = await resultsResponse.json();
            const processedResults = Array.isArray(results)
              ? results
              : results.$values && Array.isArray(results.$values)
              ? results.$values
              : results
              ? [results]
              : [];

            attempts[assessment.assessmentId] = processedResults.length;
          } catch (err) {
            // Silently handle errors and set attempts to 0
            attempts[assessment.assessmentId] = 0;
          }
        }

        setAssessmentAttempts(attempts);
      } catch (err) {
        console.error("Error fetching course details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.userId) {
      fetchCourseDetails();
    }
  }, [courseId, user]);

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

  function PdfPreview({ sasUrl }) {
    return (
      <Worker
        workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}
      >
        <Viewer fileUrl={sasUrl} />
      </Worker>
    );
  }

  function DocPreview({ sasUrl }) {
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
      sasUrl
    )}&embedded=true`;
    return (
      <iframe
        src={viewerUrl}
        width="100%"
        height="600px"
        title="DOCX Preview"
      />
    );
  }

  if (loading) {
    return (
      <div className="container mt-5 bg-white text-light">
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
      <div className="container mt-5 bg-white text-light">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mt-5 bg-white text-light">
        <div className="alert alert-warning" role="alert">
          Course not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 bg-white font font-color shadow">
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm m-4 bg-white font-color font">
            <div className="row g-0 m-4">
              <div className="col-md-6">
                {course.mediaUrl ? (
                  <img
                    src={course.mediaUrl}
                    className="img-fluid rounded-start h-100 w-90"
                    alt={course.title}
                    style={{ objectFit: "cover", borderRadius: "20px" }}
                  />
                ) : (
                  <div className="bg-dark h-100 d-flex align-items-center justify-content-center">
                    <i
                      className="bi bi-book text-muted"
                      style={{ fontSize: "5rem" }}
                    ></i>
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <div className="card-body">
                  <h1 className="card-title mb-3 font font-color">
                    {course.title}
                  </h1>
                  <p className="card-text font-color mb-4">
                    Description: {course.description}
                  </p>
                  <div className="d-flex align-items-center mb-3">
                    <div>
                      <h6 className="mb-0">Instructor</h6>
                      <p className="text-white mb-0">
                        {course.instructor?.name}
                      </p>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <a className="custom-filled" href="#courseContent">
                      <i className="bi bi-play-fill me-2"></i>
                      Start Learning
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row container m-4">
        <ul className="nav nav-tabs mb-4 bg-white">
          <li className="nav-item">
            <button
              className={`nav-link font-color ${
                activeTab === "overview" ? "active fw-bold" : ""
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link font-color  ${
                activeTab === "content" ? "active fw-bold" : ""
              }`}
              onClick={() => setActiveTab("content")}
            >
              Course Content
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link font-color ${
                activeTab === "materials" ? "active fw-bold" : ""
              }`}
              onClick={() => setActiveTab("materials")}
            >
              Assessments
            </button>
          </li>
        </ul>

        <div className="tab-content bg-white">
          {activeTab === "overview" && (
            <div
              className="card border-0 shadow-sm bg-white font-color m-4"
              id="courseContent"
            >
              <div className="card-body ">
                <h4 className="card-title mb-4">Course Overview</h4>
                <div className="mb-4">
                  <h5>What you'll learn</h5>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Understanding of key concepts
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Practical application of knowledge
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Hands-on experience with real-world examples
                    </li>
                  </ul>
                </div>
                <div>
                  <h5>Requirements</h5>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <i className="bi bi-info-circle-fill text-primary me-2"></i>
                      Basic understanding of the subject
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-info-circle-fill text-primary me-2"></i>
                      Willingness to learn and practice
                    </li>
                  </ul>
                </div>
                <br />
                {course.materialFileName && (
                  <div className="mb-4">
                    <h5>Study Material</h5>
                    <p>File: {course.materialFileName}</p>
                    <button
                      className="custom-outline-filled"
                      onClick={handleMaterialDownload}
                      disabled={downloading}
                    >
                      <i className="bi bi-download me-2"></i>
                      {downloading
                        ? "Preparing download..."
                        : "Download Study Material"}
                    </button>
                    {downloadError && (
                      <div className="text-danger mt-2">{downloadError}</div>
                    )}
                    {previewSasUrl &&
                      course.materialFileName
                        .toLowerCase()
                        .endsWith(".pdf") && (
                        <div
                          className="mt-3"
                          onClick={() => setShowPreview(true)}
                          style={{ cursor: "pointer" }}
                        >
                          <h6>Preview:</h6>
                          {showPreview ? (
                            <PdfPreview sasUrl={previewSasUrl} />
                          ) : (
                            <div className="border p-3 text-center cursor-pointer">
                              <i className="bi bi-file-pdf me-2"></i>
                              Click to preview PDF
                            </div>
                          )}
                        </div>
                      )}
                    {previewSasUrl &&
                      course.materialFileName
                        .toLowerCase()
                        .endsWith(".docx") && (
                        <div
                          className="mt-3"
                          onClick={() => setShowPreview(true)}
                          style={{ cursor: "pointer" }}
                        >
                          <h6>Preview:</h6>
                          {showPreview ? (
                            <DocPreview sasUrl={previewSasUrl} />
                          ) : (
                            <div className="border p-3 text-center cursor-pointer">
                              <i className="bi bi-file-word me-2"></i>
                              Click to preview DOCX
                            </div>
                          )}
                        </div>
                      )}
                    {previewSasUrl &&
                      !course.materialFileName.toLowerCase().endsWith(".pdf") &&
                      !course.materialFileName
                        .toLowerCase()
                        .endsWith(".docx") && (
                        <div className="mt-3">
                          <p>Preview not available for this file type.</p>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "content" && (
            <div className="card border-0 shadow-sm bg-white m-4">
              <div className="card-body">
                <h4 className="card-title mb-4 font-color font">
                  Course Content
                </h4>
                {course.courseUrl && (
                  <div className="mb-4">
                    <div className="ratio ratio-16x9">
                      <iframe
                        src={course.courseUrl}
                        title="Course Video"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        className="rounded"
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "materials" && (
            <div className="card border-0 shadow-sm bg-white m-4">
              <div className="card-body">
                <h4 className="card-title mb-4 font-color font">Assessments</h4>
                {assessments.length > 0 ? (
                  <div className="row">
                    {assessments.map((assessment) => (
                      <div
                        key={assessment.assessmentId}
                        className="col-md-4 mb-4"
                      >
                        <div className="card bg-white font-color h-100">
                          <div className="card-body">
                            <h5 className="card-title bold">
                              {assessment.title}
                            </h5>
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
                              Test your knowledge and understanding of the
                              course material.
                            </p>
                          </div>
                          <div className="card-footer bg-transparent border-top-0">
                            {user?.role === "Instructor" ? (
                              <div className="d-flex gap-2">
                                <Link
                                  to={`/edit-assessment/${assessment.assessmentId}`}
                                  className="custom-filled"
                                >
                                  <i className="bi bi-pencil me-2"></i>
                                  Edit Assessment
                                </Link>
                                <button
                                  className="custom-filled"
                                  onClick={() =>
                                    handleDeleteClick(assessment.assessmentId)
                                  }
                                >
                                  <i className="bi bi-trash me-2"></i>
                                  Delete
                                </button>
                              </div>
                            ) : (
                              <>
                                {assessmentAttempts[assessment.assessmentId] >
                                0 ? (
                                  <div>
                                    <button
                                      className="custom-filled font-color w-100 mb-2"
                                      disabled
                                    >
                                      <i className="bi bi-check-circle me-2"></i>
                                      Assessment Completed
                                    </button>
                                    <Link
                                      to={`/all-results`}
                                      className="custom-filled w-100"
                                    >
                                      <i className="bi bi-eye me-2"></i>
                                      View Results
                                    </Link>
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
                              </>
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
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1050,
          }}
          tabIndex="-1"
        >
          <div
            className="modal-dialog"
            style={{
              position: "relative",
              zIndex: 1051,
              margin: "1.75rem auto",
            }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleDeleteCancel}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete this assessment? This action
                  cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="custom-outline-filled"
                  onClick={handleDeleteCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="custom-filled"
                  onClick={handleDeleteConfirm}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop fade show"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1040,
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default CourseDetails;
