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

  const { isAuthorized, user } = useContext(Context);
  const navigateTo = useNavigate();
  const { id } = useParams();

  // Pre-fill from context user if available
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
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

  // Inline styles to keep the file self-contained
  const InlineStyles = () => (
    <style>{`
      /* Page container - keeps content below navbar */
      .application {
        padding-top: 92px; /* adjust if your navbar height differs */
        padding-bottom: 48px;
        min-height: calc(100vh - 92px);
        background: linear-gradient(180deg, #f6fbff 0%, #ffffff 100%);
        box-sizing: border-box;
        font-family: Inter, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        color: #123047;
      }

      /* Centered wrapper: narrower (approx 30% less than previous 880px) */
      .application .container {
        max-width: 620px; /* narrower and centered */
        margin: 0 auto;
        padding: 22px;
      }

      .application h3 {
        text-align: center;
        font-size: 24px;
        margin-bottom: 14px;
        color: #0b3a63;
        font-weight: 700;
      }

      /* Card */
      .app-card {
        background: linear-gradient(180deg, rgba(224,241,253,0.98) 0%, rgba(245,251,255,0.98) 100%);
        border-radius: 12px;
        padding: 22px;
        border: 1px solid rgba(11,58,99,0.06);
        box-shadow: 0 8px 22px rgba(11,58,99,0.06);
      }

      /* Form grid - more compact */
      form.app-form {
        display: grid;
        gap: 12px;
      }

      .form-row {
        display: flex;
        flex-direction: column;
      }

      label.form-label {
        font-weight: 700;
        margin-bottom: 6px;
        color: #0b3a63;
        font-size: 13px;
      }

      input[type="text"],
      input[type="email"],
      textarea,
      .file-input {
        border: none;
        border-radius: 8px;
        background: #ffffff;
        padding: 10px 12px;
        font-size: 15px;
        outline: none;
        transition: box-shadow 120ms ease, border-color 120ms ease;
        color: #16324f;
        border: 1px solid rgba(11,58,99,0.06);
        box-shadow: 0 6px 18px rgba(11,58,99,0.03);
      }

      input[type="text"]:focus,
      input[type="email"]:focus,
      textarea:focus {
        border-color: rgba(14,137,214,0.38);
        box-shadow: 0 10px 28px rgba(14,137,214,0.06);
      }

      textarea {
        min-height: 140px;
        resize: vertical;
        padding: 12px;
      }

      /* Upload block */
      .upload-block {
        display: grid;
        gap: 8px;
        padding: 12px;
        border-radius: 8px;
        border: 1px dashed rgba(11,58,99,0.08);
        background: rgba(255,255,255,0.88);
      }

      .upload-row {
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: space-between;
        flex-wrap: wrap;
      }

      .file-btn {
        display: inline-block;
        padding: 8px 12px;
        background: linear-gradient(90deg,#0b67a6,#0e89d6);
        color: #fff;
        border-radius: 8px;
        font-weight: 700;
        text-decoration: none;
        cursor: pointer;
        border: none;
      }

      input[type="file"] {
        display: none;
      }

      .file-name {
        font-size: 14px;
        color: #0b3a63;
        word-break: break-word;
      }

      .helper {
        font-size: 13px;
        color: #b03535;
      }

      .dashboard-resume {
        font-size: 14px;
        color: #0b67a6;
        font-weight: 700;
        text-decoration: underline;
      }

      .submit-row {
        margin-top: 6px;
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .submit-btn {
        background: linear-gradient(90deg,#0b67a6,#0e89d6);
        color: white;
        padding: 10px 18px;
        border-radius: 8px;
        border: none;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 10px 24px rgba(14,137,214,0.12);
        transition: transform 120ms ease, box-shadow 120ms ease;
      }
      .submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      .submit-btn:hover:not(:disabled) {
        transform: translateY(-2px);
      }

      .muted {
        color: #2a516d;
        font-size: 14px;
      }

      /* Responsive: keep it centered and narrower on smaller screens */
      @media (max-width: 740px) {
        .application .container { padding: 14px; max-width: 92%; }
        .submit-row { flex-direction: column; align-items: stretch; }
      }
    `}</style>
  );

  return (
    <section className="application" aria-labelledby="application-heading">
      <InlineStyles />
      <div className="container">
        <h3 id="application-heading">Application Form</h3>

        <div className="app-card" role="region" aria-label="Application form card">
          <form className="app-form" onSubmit={handleApplication} noValidate>
            <div className="form-row">
              <label className="form-label" htmlFor="app-name">Your Name</label>
              <input
                id="app-name"
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-required="true"
              />
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="app-email">Your Email</label>
              <input
                id="app-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
              />
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="app-phone">Phone Number</label>
              <input
                id="app-phone"
                type="text"
                placeholder="1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                aria-required="true"
              />
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="app-address">Address</label>
              <input
                id="app-address"
                type="text"
                placeholder="Your Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                aria-required="true"
              />
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="app-cover">Cover Letter</label>
              <textarea
                id="app-cover"
                placeholder="Cover Letter..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                required
                aria-required="true"
              />
            </div>

            <div className="form-row">
              <label className="form-label">Upload Resume</label>
              <div className="upload-block">
                <div className="upload-row">
                  <div style={{flex: 1}}>
                    <div className="muted">Accepted: PDF, DOC, DOCX, PNG, JPEG, WEBP — Max size: 5MB</div>
                    {dashboardResumeLink ? (
                      <div style={{ marginTop: 8 }}>
                        Saved resume:{" "}
                        <a
                          className="dashboard-resume"
                          href={dashboardResumeLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {user.resume || dashboardResumeLink.split("/").pop() || "View resume"}
                        </a>
                      </div>
                    ) : (
                      <div style={{ marginTop: 8 }} className="muted">No resume saved in Dashboard</div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <label className="file-btn" htmlFor="resume-file" role="button">
                      Choose file
                    </label>
                    <input
                      id="resume-file"
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <div>
                  <div className="file-name">{resume ? resume.name : <span className="muted">No file chosen</span>}</div>
                  {fileError && <div className="helper" role="alert">{fileError}</div>}
                </div>
              </div>
            </div>

            <div className="submit-row" aria-live="polite">
              <button
                className="submit-btn"
                type="submit"
                disabled={loading}
                aria-disabled={loading}
              >
                {loading ? "Submitting..." : "Send Application"}
              </button>
              <div style={{ marginLeft: 8, alignSelf: "center" }} className="muted">
                <div>Saved resume in Dashboard will be used if you don't upload one here.</div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Application;
