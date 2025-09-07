import axios from "axios";
import React, { useContext, useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Context } from "/src/context.jsx";

const API_BASE = "http://localhost:4000/api/v1";

const Application = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState("");

  const { isAuthorized, user } = useContext(Context);
  const navigateTo = useNavigate();
  const { id } = useParams();

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

    if (!resume) {
      setFileError("Please upload your resume");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("address", address);
    formData.append("coverLetter", coverLetter);
    formData.append("resume", resume);
    formData.append("jobId", id);

    try {
      const { data } = await axios.post(`${API_BASE}/application/post`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

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
