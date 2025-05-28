// import React, { useState, useEffect } from "react";
// import { useParams, Link } from "react-router-dom";
// import { FaArrowLeft } from "react-icons/fa";
// import config from "../config";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// const AssessmentResults = () => {
//   const { resultId } = useParams();
//   const [result, setResult] = useState(null);
//   const [allAttempts, setAllAttempts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchResultDetails = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) throw new Error("No authentication token found");

//         // First fetch basic result info
//         const resultResponse = await fetch(
//           `${config.API_BASE_URL}/api/Results/${resultId}`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );
//         if (!resultResponse.ok)
//           throw new Error("Failed to fetch result details");
//         const basicResult = await resultResponse.json();
//         console.log("Basic result:", basicResult);

//         // Then fetch detailed result with student answers
//         const detailedResponse = await fetch(
//           `${config.API_BASE_URL}/api/Results/student/${basicResult.userId}/assessment/${basicResult.assessmentId}`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );
//         if (!detailedResponse.ok)
//           throw new Error("Failed to fetch detailed result");
//         const detailedResult = await detailedResponse.json();
//         console.log(
//           "Detailed result structure:",
//           JSON.stringify(detailedResult, null, 2)
//         );

//         // Process the response to ensure proper structure
//         const processedResult = {
//           ...detailedResult,
//           questions: Array.isArray(detailedResult.questions)
//             ? detailedResult.questions
//             : detailedResult.questions?.$values || [],
//         };

//         // Fetch all attempts for this assessment
//         const attemptsResponse = await fetch(
//           `${config.API_BASE_URL}/api/Results/assessment/${basicResult.assessmentId}`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         if (attemptsResponse.ok) {
//           const attemptsData = await attemptsResponse.json();
//           const attempts = Array.isArray(attemptsData)
//             ? attemptsData
//             : attemptsData.$values || [];

//           // Filter attempts for the current user and sort by date
//           const userAttempts = attempts
//             .filter((attempt) => attempt.userId === basicResult.userId)
//             .sort((a, b) => new Date(b.attemptDate) - new Date(a.attemptDate));

//           setAllAttempts(userAttempts);
//         }

//         console.log("Processed result:", processedResult);
//         setResult(processedResult);
//       } catch (err) {
//         console.error("Error in fetchResultDetails:", err);
//         setError(err.message);
//         toast.error(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchResultDetails();
//   }, [resultId]);

//   if (loading) {
//     return (
//       <div className="container-fluid bg-white min-vh-100">
//         <div className="container mt-5">
//           <div className="text-center">
//             <div
//               className="spinner-border text-primary"
//               role="status"
//               style={{ width: "3rem", height: "3rem" }}
//             >
//               <span className="visually-hidden">Loading...</span>
//             </div>
//             <p className="mt-3 text-dark">Loading assessment details...</p>
//           </div>
//         </div>
//         <ToastContainer position="top-right" autoClose={5000} />
//       </div>
//     );
//   }

//   if (!result || !result.questions || result.questions.length === 0) {
//     return (
//       <div className="container-fluid bg-white min-vh-100">
//         <div className="container mt-5">
//           <div className="alert alert-info" role="alert">
//             No question data found for this assessment.
//           </div>
//         </div>
//         <ToastContainer position="top-right" autoClose={5000} />
//       </div>
//     );
//   }

//   return (
//     <div className="create-assessment-container shadow min-vh-100 font font-color">
//       <ToastContainer position="top-right" autoClose={5000} />
//       <div className="container">
//         <div className="d-flex justify-content-between align-items-center mb-4">
//           <h2 className="mb-0 bold">{result.assessmentTitle}</h2>
//           <Link to="/all-results" className="custom-outline-filled">
//             <FaArrowLeft className="me-2" />
//             Back to Results
//           </Link>
//         </div>
//         <div className="card mb-4">
//           <div className="card-body">
//             <h4 className="card-title bold">Result Summary : </h4>
//             <div className="row">
//               <div className="col-md-6">
//                 <p className="mb-2">
//                   <strong>Score:</strong> {result.score} / {result.maxScore}
//                 </p>
//                 <p className="mb-2">
//                   <strong>Percentage:</strong>{" "}
//                   {Math.round((result.score / result.maxScore) * 100)}%
//                 </p>
//               </div>
//               <div className="col-md-6">
//                 <p className="mb-2">
//                   <strong>Attempted on:</strong>{" "}
//                   {new Date(result.attemptDate).toLocaleString()}
//                 </p>
//                 <p className="mb-2">
//                   <strong>Total Questions:</strong> {result.maxScore}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         <h3 className="text-dark mb-4 bold">Question Details</h3>
//         {result.questions.map((question, idx) => {
//           // Ensure we have options to display
//           const options = question.allOptions?.$values || [];

//           return (
//             <div
//               key={`question-${question.questionId || idx}`}
//               className="card mb-4"
//             >
//               <div className="card-body">
//                 <div className="d-flex justify-content-between align-items-start mb-3">
//                   <h5 className="card-title text-dark mb-0 bold">
//                     Question {idx + 1} of {result.maxScore}
//                   </h5>
//                   <span
//                     className={`d-inline-flex align-items-center gap-2 px-3 py-1 fw-semibold text-white ${
//                       question.isCorrect ? "bg-success" : "bg-danger"
//                     }`}
//                     style={{
//                       fontSize: "0.9rem",
//                       boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
//                       transition: "background-color 0.3s ease-in-out",
//                       borderRadius: "12px",
//                     }}
//                   >
//                     <i
//                       className={`bi ${
//                         question.isCorrect
//                           ? "bi-check-circle-fill"
//                           : "bi-x-circle-fill"
//                       }`}
//                       style={{ fontSize: "1rem" }}
//                     ></i>
//                     {question.isCorrect ? "Correct" : "Incorrect"}
//                   </span>
//                 </div>
//                 <p className="card-text bold mb-4 fs-5">
//                   {question.questionText}
//                 </p>
//                 <div className="options mb-4">
//                   {options.map((option, optionIdx) => {
//                     const isSelected =
//                       option.optionId ===
//                       question.studentAnswer?.selectedOptionId;
//                     const isCorrect =
//                       option.optionId === question.correctOption?.optionId;

//                     let optionClass = "list-group-item mb-2 rounded-3 p-3";
//                     if (isSelected && isCorrect) {
//                       optionClass += " bg-success bg-opacity-10 border-success";
//                     } else if (isSelected && !isCorrect) {
//                       optionClass += " bg-danger bg-opacity-10 border-danger";
//                     } else if (isCorrect) {
//                       optionClass += " border-success";
//                     }

//                     return (
//                       <div
//                         key={`question-${question.questionId || idx}-option-${
//                           option.optionId || optionIdx
//                         }`}
//                         className={optionClass}
//                       >
//                         <div className="d-flex align-items-center">
//                           <div className="me-3">
//                             {isCorrect && (
//                               <i className="bi bi-check-circle-fill text-success fs-5"></i>
//                             )}
//                             {isSelected && !isCorrect && (
//                               <i className="bi bi-x-circle-fill text-danger fs-5"></i>
//                             )}
//                           </div>
//                           <div className="flex-grow-1">
//                             <p className="mb-0 fs-6">
//                               {option.text}
//                               {isSelected && (
//                                 <span className="ms-2 text-muted">
//                                   (Your Answer)
//                                 </span>
//                               )}
//                               {!isSelected && isCorrect && (
//                                 <span className="ms-2 text-success fw-semibold">
//                                   (Correct Answer)
//                                 </span>
//                               )}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//                 {/* {!question.isCorrect && (
//                   <div className="alert alert-info mt-3">
//                     <i className="bi bi-info-circle me-2"></i>
//                     <strong>Explanation:</strong> The correct answer is
//                     highlighted with a green border. Your selected answer is
//                     marked in red.
//                   </div>
//                 )} */}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default AssessmentResults;

import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import config from "../config";
import { FaArrowLeft } from "react-icons/fa";

const AssessmentResults = () => {
  const { assessmentId } = useParams();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAllAttempts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        const response = await fetch(
          `${config.API_BASE_URL}/api/Results/assessment/${assessmentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch attempts");

        const data = await response.json();

        // Normalize array in case of nested $values (for .NET WebAPI collections)
        const attemptsData = Array.isArray(data) ? data : data.$values || [];

        // Sort attempts by attemptDate descending (latest first)
        attemptsData.sort(
          (a, b) => new Date(b.attemptDate) - new Date(a.attemptDate)
        );

        setAttempts(attemptsData);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAttempts();
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="container text-center mt-5">
        <div
          className="spinner-border text-primary"
          role="status"
          style={{ width: "3rem", height: "3rem" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading assessment attempts...</p>
        <ToastContainer position="top-right" autoClose={5000} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
        <ToastContainer position="top-right" autoClose={5000} />
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="container mt-5">
        <div className="alert alert-info">
          No attempts found for this assessment.
        </div>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <Link to="/assessments" className="btn btn-outline-secondary mb-4">
        <FaArrowLeft className="me-2" />
        Back to Assessments
      </Link>
      <h2 className="mb-4">Assessment Attempts - {assessmentId}</h2>

      <table className="table table-hover table-bordered">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Student Name</th>
            <th>Score</th>
            <th>Percentage</th>
            <th>Attempt Date</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((attempt, idx) => {
            const percentage = attempt.maxScore
              ? ((attempt.score / attempt.maxScore) * 100).toFixed(2)
              : "N/A";

            return (
              <tr key={attempt.resultId || idx}>
                <td>{idx + 1}</td>
                <td>{attempt.studentName || attempt.userName || "Unknown"}</td>
                <td>
                  {attempt.score} / {attempt.maxScore}
                </td>
                <td>{percentage}%</td>
                <td>{new Date(attempt.attemptDate).toLocaleString()}</td>
                <td>
                  <Link
                    to={`/assessment-result/${attempt.resultId}`}
                    className="btn btn-sm btn-primary"
                  >
                    View Detail
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default AssessmentResults;
