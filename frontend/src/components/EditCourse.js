import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./common.css";

const EditCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [course, setCourse] = useState({
    title: "",
    description: "",
    mediaUrl: "",
    courseUrl: "",
    materialUrl: "",
    materialFileName: "",
  });
  const [materialFile, setMaterialFile] = useState(null);
  const [materialUploadProgress, setMaterialUploadProgress] = useState(0);
  const [materialUploadError, setMaterialUploadError] = useState("");

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `http://localhost:7197/api/Courses/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch course");
      }

      const data = await response.json();
      console.log("Fetched course data:", data);
      setCourse(data);
    } catch (err) {
      console.error("Error fetching course:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setCourse({ ...course, [e.target.name]: e.target.value });
  };

  const handleMaterialFileChange = async (e) => {
    const file = e.target.files[0];
    setMaterialFile(file);
    setMaterialUploadProgress(0);
    setMaterialUploadError("");
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      setMaterialUploadProgress(10);
      const response = await fetch("http://localhost:7197/api/file/upload", {
        method: "POST",
        body: formData,
      });
      setMaterialUploadProgress(60);
      if (!response.ok) {
        throw new Error("Failed to upload file");
      }
      const data = await response.json();
      setMaterialUploadProgress(100);
      setCourse((prev) => ({
        ...prev,
        materialUrl: data.fileUrl,
        materialFileName: file.name,
      }));
    } catch (err) {
      setMaterialUploadError("File upload failed: " + err.message);
      setMaterialUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Process YouTube URL
      let processedCourseUrl = course.courseUrl;
      if (processedCourseUrl?.includes("youtube.com/watch?v=")) {
        const videoId = processedCourseUrl.split("v=")[1].split("&")[0];
        processedCourseUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (processedCourseUrl?.includes("youtu.be/")) {
        const videoId = processedCourseUrl.split("youtu.be/")[1].split("?")[0];
        processedCourseUrl = `https://www.youtube.com/embed/${videoId}`;
      }

      const courseData = {
        ...course,
        courseUrl: processedCourseUrl,
      };

      const response = await fetch(
        `http://localhost:7197/api/Courses/${courseId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(courseData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update course");
      }

      navigate(-1);
    } catch (err) {
      console.error("Error updating course:", err);
      setError(err.message);
    } finally {
      setLoading(false);
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
    <div className="create-assessment-container mt-4 bg-white font font-color shadow p-4">
      <h2 className="card-title mb-4">Edit Course</h2>
      <div className="row">
        <div className="col-12">
          <div className="card border-0 bg-white font-color">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="title" className="form-label bold">
                  Course Title
                </label>
                <input
                  type="text"
                  className="form-control custom-input no-focus-shadow"
                  id="title"
                  name="title"
                  value={course.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="description" className="form-label bold">
                  Description
                </label>
                <textarea
                  className="form-control custom-input no-focus-shadow"
                  id="description"
                  name="description"
                  value={course.description}
                  onChange={handleInputChange}
                  rows="4"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="mediaUrl" className="form-label bold">
                  Course Image URL
                </label>
                <input
                  type="url"
                  className="form-control custom-input no-focus-shadow"
                  id="mediaUrl"
                  name="mediaUrl"
                  value={course.mediaUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="courseUrl" className="form-label bold">
                  Course Video URL (YouTube)
                </label>
                <input
                  type="url"
                  className="form-control custom-input no-focus-shadow"
                  id="courseUrl"
                  name="courseUrl"
                  value={course.courseUrl}
                  onChange={handleInputChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div className="mb-3">
                <label htmlFor="materialFile" className="form-label bold">
                  Study Material (PDF, DOCX, etc.)
                </label>
                <input
                  type="file"
                  className="form-control custom-input no-focus-shadow"
                  id="materialFile"
                  name="materialFile"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.mp4,.avi,.mkv,.csv,.xlsx,.xls,.json,.xml,.md,.rtf,.odt,.ods,.odp,.svg,.gif,.bmp,.mp3,.wav,.aac,.flac,.ogg,.webm,.mov,.wmv,.7z,.tar,.gz,.bz2,.xz,.apk,.exe,.msi,.dmg,.iso,.img,.bin,.bat,.sh,.ps1,.c,.cpp,.h,.hpp,.java,.py,.js,.ts,.tsx,.jsx,.html,.css,.scss,.sass,.less,.go,.rs,.swift,.kt,.dart,.php,.rb,.pl,.lua,.sql,.db,.sqlite,.accdb,.mdb,.log,.conf,.ini,.cfg,.env,.yml,.yaml,.toml,.lock,.pem,.crt,.cer,.key,.csr,.pfx,.p12,.asc,.gpg,.pgp,.sig,.sln,.csproj,.vbproj,.fsproj,.vcxproj,.xcodeproj,.xcworkspace,.sublime-project,.sublime-workspace,.vscode,.vsix,.vsixmanifest,.nupkg,.nuspec,.dll,.exe,.so,.dylib,.a,.lib,.obj,.o,.pdb,.idb,.ilk,.exp,.lib,.def,.res,.rc,.rct,.rc2,.rcv,.rcs,.rcx,.rcy,.rcz,.rcw,.rca,.rcb,.rcc,.rcd,.rce,.rcf,.rcg,.rch,.rci,.rcj,.rck,.rcl,.rcm,.rcn,.rco,.rcp,.rcq,.rcr,.rcs,.rct,.rcu,.rcv,.rcw,.rcx,.rcy,.rcz"
                  onChange={handleMaterialFileChange}
                />
                {materialUploadProgress > 0 && (
                  <div className="progress mt-2">
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${materialUploadProgress}%` }}
                      aria-valuenow={materialUploadProgress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {materialUploadProgress}%
                    </div>
                  </div>
                )}
                {materialUploadError && (
                  <div className="text-danger mt-2">{materialUploadError}</div>
                )}
                {course.materialFileName && (
                  <div className="text-success mt-2">
                    Uploaded: {course.materialFileName}
                  </div>
                )}
              </div>

              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="custom-filled"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="custom-outline-filled"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCourse;
