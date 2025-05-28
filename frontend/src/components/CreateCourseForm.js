import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateCourseForm = ({
  editingCourse,
  fetchInstructorCourses,
  setShowForm,
  setEditingCourse,
}) => {
  const navigate = useNavigate();

  const [newCourse, setNewCourse] = useState({
    title: editingCourse?.title || "",
    description: editingCourse?.description || "",
    mediaUrl: editingCourse?.mediaUrl || "",
    courseUrl: editingCourse?.courseUrl || "",
    materialUrl: editingCourse?.materialUrl || "",
    materialFileName: editingCourse?.materialFileName || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [materialFile, setMaterialFile] = useState(null);
  const [materialUploadProgress, setMaterialUploadProgress] = useState(0);
  const [materialUploadError, setMaterialUploadError] = useState("");

  const handleInputChange = (e) => {
    setNewCourse({ ...newCourse, [e.target.name]: e.target.value });
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
      setNewCourse((prev) => ({
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
      if (!token) throw new Error("No authentication token found");

      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser?.userId) {
        throw new Error("User information not found. Please log in again.");
      }

      // Process YouTube URL
      let processedCourseUrl = newCourse.courseUrl;
      if (processedCourseUrl?.includes("youtube.com/watch?v=")) {
        const videoId = processedCourseUrl.split("v=")[1].split("&")[0];
        processedCourseUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (processedCourseUrl?.includes("youtu.be/")) {
        const videoId = processedCourseUrl.split("youtu.be/")[1].split("?")[0];
        processedCourseUrl = `https://www.youtube.com/embed/${videoId}`;
      }

      const courseData = {
        courseId: editingCourse?.courseId || crypto.randomUUID(),
        title: newCourse.title,
        description: newCourse.description,
        instructorId: storedUser.userId,
        mediaUrl: newCourse.mediaUrl || null,
        courseUrl: processedCourseUrl || null,
        materialUrl: newCourse.materialUrl || null,
        materialFileName: newCourse.materialFileName || null,
      };

      const url = editingCourse
        ? `http://localhost:7197/api/Courses/${editingCourse.courseId}`
        : "http://localhost:7197/api/Courses";

      const response = await fetch(url, {
        method: editingCourse ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save course");
      }

      await fetchInstructorCourses();
      setShowForm(false);
      setEditingCourse(null);
      setNewCourse({
        title: "",
        description: "",
        mediaUrl: "",
        courseUrl: "",
        materialUrl: "",
        materialFileName: "",
      });
    } catch (err) {
      console.error("Error saving course:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      navigate("/instructor-dashboard");
    }
  };

  return (
    <div className="container mt-4">
      <div className="create-assessment-container border-0 shadow bg-white font-color font">
        <div className="card-body">
          <h4 className="card-title mb-4 bold">
            {editingCourse ? "Edit Course" : "Add New Course"}
          </h4>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="title" className="form-label">
                Course Title
              </label>
              <input
                type="text"
                className="form-control custom-input no-focus-shadow"
                id="title"
                name="title"
                value={newCourse.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                className="form-control custom-input no-focus-shadow"
                id="description"
                name="description"
                value={newCourse.description}
                onChange={handleInputChange}
                rows="4"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="mediaUrl" className="form-label">
                Course Image URL
              </label>
              <input
                type="url"
                className="form-control custom-input no-focus-shadow"
                id="mediaUrl"
                name="mediaUrl"
                value={newCourse.mediaUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="courseUrl" className="form-label">
                Course Video URL (YouTube)
              </label>
              <input
                type="url"
                className="form-control custom-input no-focus-shadow"
                id="courseUrl"
                name="courseUrl"
                value={newCourse.courseUrl}
                onChange={handleInputChange}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div className="mb-3">
              <label htmlFor="materialFile" className="form-label">
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
              {materialUploadProgress > 0 && materialUploadProgress < 100 && (
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
              {newCourse.materialFileName && (
                <div className="text-success mt-2">
                  Uploaded: {newCourse.materialFileName}
                </div>
              )}
            </div>
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="custom-filled"
                disabled={loading}
              >
                {loading
                  ? editingCourse
                    ? "Updating..."
                    : "Saving..."
                  : editingCourse
                  ? "Update Course"
                  : "Create Course"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCourseForm;
