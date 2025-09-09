// frontend/src/pages/Application.jsx
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Context } from "/src/context.jsx";

const API_BASE = "http://localhost:4000/api/v1";
const API_ROOT = "http://localhost:4000";

const Application = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState("");

  const { isAuthorized, user, setUser } = useContext(Context);
  const navigateTo = useNavigate();
  const { id } = useParams();

  // Pre-fill from context user if available
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      // if you store address differently, adapt below
      setAddress(user.address || user.profileAddress || "");
    }
  }, [user]);

  // file validation accepts PDFs/docs and common images
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFileError("");

    if (!file) {
      setResume(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setFileError("Supported: PDF, DOC, DOCX, PNG, JPEG, WEBP");
      setResume(null);
      return;
    }

    // allow up to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setFileError("File size should be less than 5MB");
      setResume(null);
      return;
    }

    setResume(file);
  };

  const handleApplication = async (e) => {
    e.preventDefault();

    if (!name || !email || !phone || !address || !coverLetter) {
      toast.error("Please fill in all fields");
      return;
    }

    // If user didn't upload a file in this form, but Dashboard has saved resume (user.resumePath or user.resume), allow it
    const hasDashboardResume = user && (user.resumePath || user.resume);
    if (!resume && !hasDashboardResume) {
      setFileError("Please upload your resume or add it in Dashboard");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("address", address);
      formData.append("coverLetter", coverLetter);
      formData.append("jobId", id);

      if (resume) {
        formData.append("resume", resume);
      }

      const { data } = await axios.post(`${API_BASE}/application/post`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Reset fields
      setName("");
      setEmail("");
      setCoverLetter("");
      setPhone("");
      setAddress("");
      setResume(null);
      toast.success(data.message || "Application submitted");
      navigateTo("/job/getall");
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Something went wrong. Please try again later.";
      toast.error(errorMessage);

      if (errorMessage.toLowerCase().includes("cloudinary") || errorMessage.includes("api_key")) {
        toast.error("File upload service is currently unavailable. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Block employers from this page
  if (!isAuthorized) return <Navigate to="/login" replace />;
  if (user && user.role === "Employer") return <Navigate to="/" replace />;

  // Build dashboard resume link (if present)
  const dashboardResumeLink = (() => {
    if (!user) return null;
    if (user.resumePath) {
      return user.resumePath.startsWith("http") ? user.resumePath : `${API_ROOT}${user.resumePath}`;
    }
    if (user.resume) {
      return `${API_ROOT}/static/uploads/resumes/${user.resume}`;
    }
    return null;
  })();

  return (
    <section className="application">
      <div className="container">
        <h3>Application Form</h3>
        <form onSubmit={handleApplication}>
          <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="Your Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="text" placeholder="Your Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <input type="text" placeholder="Your Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
          <textarea placeholder="Cover Letter..." value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} required />
          <div>
            <label style={{ textAlign: "start", display: "block", fontSize: "20px" }}>
              Upload Resume
              <p style={{ color: "red", fontSize: "12px", margin: "5px 0 0 0" }}>
                (Supported formats: PDF, DOC, DOCX, PNG, JPEG, WEBP. Max size: 5MB)
              </p>
            </label>

            {/* Show saved resume from Dashboard if present */}
            {dashboardResumeLink ? (
              <p style={{ marginTop: 6 }}>
                Saved resume:{" "}
                <a href={dashboardResumeLink} target="_blank" rel="noreferrer">
                  {user.resume || dashboardResumeLink.split("/").pop() || "View resume"}
                </a>
              </p>
            ) : (
              <p style={{ color: "#666", marginTop: 6 }}>No resume saved in Dashboard</p>
            )}

            <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={handleFileChange} style={{ width: "100%" }} />
            {fileError && <p style={{ color: "red", fontSize: "14px", marginTop: "5px" }}>{fileError}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Submitting..." : "Send Application"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Application;
