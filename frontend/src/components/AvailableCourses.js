// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { courseService } from '../services/courseService';
// import { authService } from '../services/authService';
// import './Dashboard.css';

// const AvailableCourses = () => {
//     const navigate = useNavigate();
//     const [courses, setCourses] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');

//     useEffect(() => {
//         fetchAvailableCourses();
//     }, []);

//     const fetchAvailableCourses = async () => {
//         try {
//             setError('');
//             const data = await courseService.getAvailableCourses();
//             setCourses(data);
//         } catch (err) {
//             setError(err.message || 'Failed to load available courses');
//             console.error('Error fetching courses:', err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleEnroll = async (courseId) => {
//         try {
//             await courseService.enrollInCourse(courseId);
//             navigate('/student-dashboard');
//         } catch (err) {
//             setError('Failed to enroll in course');
//         }
//     };

//     if (loading) {
//         return <div className="dashboard-loading">Loading...</div>;
//     }

//     return (
//         <div className="dashboard-container">
//             <header className="dashboard-header">
//                 <h1>Available Courses</h1>
//                 <button onClick={() => navigate('/student-dashboard')} className="back-button">
//                     Back to Dashboard
//                 </button>
//             </header>

//             {error && (
//                 <div className="error-message">
//                     <p>{error}</p>
//                     <button onClick={fetchAvailableCourses} className="retry-button">
//                         Retry
//                     </button>
//                 </div>
//             )}

//             <main className="dashboard-content">
//                 <section className="courses-section">
//                     <div className="section-header">
//                         <h2>Browse Courses</h2>
//                     </div>
//                     {courses.length === 0 ? (
//                         <div className="empty-state">
//                             <p>No courses available at the moment.</p>
//                         </div>
//                     ) : (
//                         <div className="courses-grid">
//                             {courses.map(course => (
//                                 <div key={course.courseId} className="course-card">
//                                     <h3>{course.title}</h3>
//                                     <p>{course.description}</p>
//                                     <div className="course-meta">
//                                         <span>Instructor: {course.instructor?.name || 'Unknown'}</span>
//                                     </div>
//                                     <div className="course-actions">
//                                         <button
//                                             onClick={() => handleEnroll(course.courseId)}
//                                             className="enroll-button"
//                                         >
//                                             Enroll Now
//                                         </button>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </section>
//             </main>
//         </div>
//     );
// };

// export default AvailableCourses;

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import config from "../config";
import "./common.css";

const AvailableCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [courseAssessments, setCourseAssessments] = useState({});
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resultsCache, setResultsCache] = useState(new Map());

  const fetchAssessmentsForCourse = async (courseId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Fetching assessments for course:", courseId);

      const response = await fetch(
        `http://localhost:7197/api/Assessments/course/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          mode: "cors",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          console.log("No assessments found for course:", courseId);
          return [];
        }
        throw new Error(
          errorData.message || `Failed to fetch assessments: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Fetched assessments:", data);

      const assessments = Array.isArray(data)
        ? data
        : data.$values && Array.isArray(data.$values)
        ? data.$values
        : [];

      console.log("Processed assessments:", assessments);
      return assessments;
    } catch (err) {
      console.error(`Error fetching assessments for course ${courseId}:`, err);
      return [];
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Fetching enrolled courses...");

      const response = await fetch(
        "http://localhost:7197/api/Courses/enrolled",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          mode: "cors",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch enrolled courses: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Fetched enrolled courses:", data);

      const enrolledCourses = Array.isArray(data)
        ? data
        : data.$values && Array.isArray(data.$values)
        ? data.$values
        : [];

      console.log("Processed enrolled courses:", enrolledCourses);
      setEnrolledCourses(enrolledCourses);

      // Fetch assessments for each enrolled course
      const assessmentsMap = {};
      for (const course of enrolledCourses) {
        const assessments = await fetchAssessmentsForCourse(course.courseId);
        assessmentsMap[course.courseId] = assessments;
      }
      setCourseAssessments(assessmentsMap);

      return enrolledCourses;
    } catch (err) {
      console.error("Error fetching enrolled courses:", err);
      setError(err.message || "Failed to load enrolled courses");
      setEnrolledCourses([]);
      return [];
    }
  };

  const fetchCourses = async (enrolledCoursesData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Fetching available courses...");
      console.log("Current enrolled courses data:", enrolledCoursesData);

      const response = await fetch(
        "http://localhost:7197/api/Courses/available",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          mode: "cors",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch courses: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Raw API response:", data);

      // Handle the response format correctly
      const allCourses = Array.isArray(data)
        ? data
        : data.$values && Array.isArray(data.$values)
        ? data.$values
        : [];

      console.log("All courses after array check:", allCourses);

      // Filter out courses that are already enrolled
      const availableCourses = allCourses.filter((course) => {
        if (!course || !course.courseId) {
          console.log("Invalid course object:", course);
          return false;
        }
        const isEnrolled = enrolledCoursesData.some((enrolled) => {
          console.log("Comparing:", {
            enrolledCourseId: enrolled?.courseId,
            currentCourseId: course.courseId,
          });
          return enrolled?.courseId === course.courseId;
        });
        console.log(
          `Course ${course.courseId} - ${course.title} is enrolled:`,
          isEnrolled
        );
        return !isEnrolled;
      });

      console.log("Final filtered available courses:", availableCourses);
      setCourses(availableCourses);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(err.message || "Failed to load courses");
      setCourses([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessmentResults = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // First get all enrolled courses
      const enrolledResponse = await fetch(
        `${config.API_BASE_URL}${config.API_ENDPOINTS.COURSES.ENROLLED}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          mode: "cors",
        }
      );

      if (!enrolledResponse.ok) {
        throw new Error("Failed to fetch enrolled courses");
      }

      const enrolledCourses = await enrolledResponse.json();
      const processedEnrolledCourses = Array.isArray(enrolledCourses)
        ? enrolledCourses
        : enrolledCourses.$values && Array.isArray(enrolledCourses.$values)
        ? enrolledCourses.$values
        : [];

      // Get all assessment results for enrolled courses
      const allResults = [];
      for (const course of processedEnrolledCourses) {
        const assessments = await fetchAssessmentsForCourse(course.courseId);
        for (const assessment of assessments) {
          try {
            // Check cache first
            if (resultsCache.has(assessment.assessmentId)) {
              const cachedResults = resultsCache.get(assessment.assessmentId);
              if (cachedResults && cachedResults.length > 0) {
                allResults.push(...cachedResults);
                continue;
              }
            }

            // Try fetching by result IDs first
            const resultIds = JSON.parse(
              localStorage.getItem(`results_${assessment.assessmentId}`) || "[]"
            );
            if (resultIds.length > 0) {
              console.log("Found cached result IDs:", resultIds);
              for (const resultId of resultIds) {
                try {
                  const resultResponse = await fetch(
                    `${
                      config.API_BASE_URL
                    }${config.API_ENDPOINTS.RESULTS.GET_BY_ID(resultId)}`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                      },
                    }
                  );

                  if (resultResponse.ok) {
                    const result = await resultResponse.json();
                    const mappedResult = {
                      ...result,
                      assessmentTitle: assessment.title,
                      maxScore: assessment.maxScore,
                    };
                    allResults.push(mappedResult);
                    console.log(
                      `Found result by ID for assessment "${assessment.title}"`
                    );
                  }
                } catch (err) {
                  console.error(`Error fetching result ${resultId}:`, err);
                }
              }
            }

            // If we have results from localStorage, cache them
            if (allResults.length > 0) {
              const assessmentResults = allResults.filter(
                (r) => r.assessmentId === assessment.assessmentId
              );
              if (assessmentResults.length > 0) {
                setResultsCache((prev) =>
                  new Map(prev).set(assessment.assessmentId, assessmentResults)
                );
              }
            }

            // Try the assessment results endpoint as a fallback
            console.log(
              "Trying assessment results endpoint for:",
              assessment.title
            );
            const resultsResponse = await fetch(
              `${
                config.API_BASE_URL
              }${config.API_ENDPOINTS.RESULTS.GET_BY_ASSESSMENT(
                assessment.assessmentId
              )}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
              }
            );

            if (resultsResponse.ok) {
              const results = await resultsResponse.json();
              const processedResults = Array.isArray(results)
                ? results
                : results.$values && Array.isArray(results.$values)
                ? results.$values
                : [];

              const userResults = processedResults.filter(
                (result) =>
                  result.userId.toLowerCase() === user.userId.toLowerCase()
              );

              const mappedResults = userResults.map((result) => ({
                ...result,
                assessmentTitle: assessment.title,
                maxScore: assessment.maxScore,
              }));

              setResultsCache((prev) =>
                new Map(prev).set(assessment.assessmentId, mappedResults)
              );
              allResults.push(...mappedResults);
            }
          } catch (err) {
            console.error(
              `Error processing assessment ${assessment.assessmentId}:`,
              err
            );
          }
        }
      }

      // Sort results by attempt date (most recent first)
      allResults.sort(
        (a, b) => new Date(b.attemptDate) - new Date(a.attemptDate)
      );
      console.log("Final assessment results:", allResults);
      setAssessmentResults(allResults);
    } catch (err) {
      console.error("Error fetching assessment results:", err);
      setError(err.message || "Failed to load assessment results");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Clear the results cache
        setResultsCache(new Map());
        const enrolled = await fetchEnrolledCourses();
        console.log("Enrolled courses before fetching available:", enrolled);
        await fetchCourses(enrolled);
        await fetchAssessmentResults();
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Attempting to enroll in course:", courseId);

      const response = await fetch(
        `http://localhost:7197/api/Courses/${courseId}/enroll`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          mode: "cors",
          credentials: "omit",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("Enrollment error response:", data);
        throw new Error(data.message || `Failed to enroll: ${response.status}`);
      }

      console.log("Enrollment successful:", data);

      // First fetch enrolled courses
      const enrolled = await fetchEnrolledCourses();
      // Then fetch available courses using the updated enrolled courses
      await fetchCourses(enrolled);

      toast.success(data.message || "Successfully enrolled in the course!");
    } catch (err) {
      console.error("Error enrolling in course:", err);
      if (err.message.includes("Failed to fetch")) {
        setError(
          "Network error: Please check if the backend server is running and accessible."
        );
      } else {
        setError(err.message || "Failed to enroll in course");
      }
    }
  };

  return (
    <div className="mt-4 container">
      <h3 className="mb-4 font-color font" style={{ fontWeight: "700" }}>
        Available Courses
      </h3>
      {courses.length === 0 ? (
        <div className="alert alert-info">
          No courses available at the moment.
        </div>
      ) : (
        <div className="row">
          {courses.map((course) => (
            <div key={course.courseId} className="col-md-6 col-lg-3 mb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="card h-100 shadow-sm"
                style={{ backgroundColor: "#fff", color: "#332D56" }}
              >
                {course.mediaUrl && (
                  <img
                    src={course.mediaUrl}
                    className="card-img-top"
                    alt={`${course.title} thumbnail`}
                    style={{
                      height: "150px",
                      objectFit: "cover",
                      borderTopLeftRadius: "20px",
                      borderTopRightRadius: "20px",
                    }}
                  />
                )}
                <div className="card-body">
                  <h5 className="card-title" style={{ fontWeight: "700" }}>
                    {course.title}
                  </h5>
                  <p className="card-text text-truncate">
                    {course.description}
                  </p>
                  <div className="mt-3">
                    <p className="card-text">
                      <small>
                        Instructor: {course.instructor?.name || "Unknown"}
                      </small>
                    </p>
                  </div>
                </div>
                <div className="card-footer bg-transparent border-top-0">
                  <button
                    onClick={() => handleEnroll(course.courseId)}
                    className="custom-filled w-100"
                  >
                    Enroll Now
                  </button>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableCourses;
