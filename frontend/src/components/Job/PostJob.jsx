// frontend/src/pages/PostJob.jsx
import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Context } from "/src/context.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api/v1";

const PostJob = () => {
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [salaryFrom, setSalaryFrom] = useState("");
  const [salaryTo, setSalaryTo] = useState("");
  const [fixedSalary, setFixedSalary] = useState("");
  const [salaryType, setSalaryType] = useState("default");
  const [skillsInput, setSkillsInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { isAuthorized, user } = useContext(Context);
  const navigate = useNavigate();

  // redirect if not authorized / not employer
  useEffect(() => {
    if (!isAuthorized || (user && user.role !== "Employer")) {
      navigate("/");
    }
  }, [isAuthorized, user, navigate]);

  // inject bootstrap CSS once
  useEffect(() => {
    const id = "bootstrap-cdn-jobnest";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";
      document.head.appendChild(link);
    }
  }, []);

  // measure navbar & set CSS var so page content sits below navbar
  useEffect(() => {
    const setNavVar = () => {
      const nav =
        document.querySelector("nav") ||
        document.querySelector(".navbar") ||
        document.querySelector("header") ||
        document.querySelector(".topbar");
      const height = nav ? Math.ceil(nav.getBoundingClientRect().height) : 72;
      document.documentElement.style.setProperty("--navbar-height", `${height}px`);
    };
    setNavVar();
    window.addEventListener("resize", setNavVar);
    return () => window.removeEventListener("resize", setNavVar);
  }, []);

  const handleJobPost = async (e) => {
    e.preventDefault();

    if (salaryType === "Fixed Salary") {
      setSalaryFrom("");
      setSalaryTo("");
    } else if (salaryType === "Ranged Salary") {
      setFixedSalary("");
    }

    const skills = typeof skillsInput === "string" && skillsInput.trim()
      ? skillsInput.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const payload = fixedSalary && String(fixedSalary).length >= 1
      ? { title, companyName, description, category, country, city, location, fixedSalary, skills, startDate, endDate }
      : { title, companyName, description, category, country, city, location, salaryFrom, salaryTo, skills, startDate, endDate };

    try {
      const res = await axios.post(`${API_BASE}/job/post`, payload, { withCredentials: true });
      toast.success(res.data?.message || "Job Posted Successfully!");
      // clear
      setTitle(""); setCompanyName(""); setDescription(""); setCategory("");
      setCountry(""); setCity(""); setLocation(""); setSalaryFrom(""); setSalaryTo("");
      setFixedSalary(""); setSalaryType("default"); setSkillsInput(""); setStartDate(""); setEndDate("");
      navigate("/job/me");
    } catch (err) {
      console.error("[PostJob] error:", err);
      toast.error(err?.response?.data?.message || err.message || "Failed to post job");
    }
  };

  return (
    <div className="post-job-page" style={{ "--navbar-height": "72px" }}>
      {/* Inline CSS — drop-in, no external file required */}
      <style>{`
        :root {
          --navbar-height: 72px;
          --card-bg: #ffffff;
          --accent: #2d86c3;
          --muted: #6b7280;
          --border: rgba(11,29,44,0.06);
        }

        body { -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }

        .post-job-page {
          padding: calc(var(--navbar-height, 72px) + 30px) 18px 80px;
          background: linear-gradient(180deg, #f7fbff 0%, #eef6fb 60%);
          min-height: calc(100vh - var(--navbar-height, 72px));
          box-sizing: border-box;
          font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
          color: #0b2545;
        }

        .pg-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .card-form {
          background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, #fbfdff 100%);
          border-radius: 14px;
          padding: 22px;
          border: 1px solid var(--border);
          box-shadow: 0 12px 30px rgba(11,28,50,0.06);
        }

        .form-header {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          margin-bottom: 18px;
        }
        .form-header h2 {
          margin:0; font-size:22px; font-weight:800; color:#0b2545;
        }
        .form-sub { color:var(--muted); font-size:14px; }

        /* grid: two columns for inputs */
        .form-grid {
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 20px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .form-grid { grid-template-columns: 1fr; }
        }

        .full-width { grid-column: 1 / -1; }

        label.input-label {
          display:block;
          font-weight:700;
          color:#243244;
          font-size:13px;
          margin-bottom:8px;
        }

        input[type="text"], input[type="number"], input[type="datetime-local"], select, textarea {
          width:100%;
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: #fff;
          outline: none;
          font-size: 14px;
          color: #0b2545;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.5);
        }

        textarea { min-height: 140px; resize: vertical; }

        input[type="text"]::placeholder, textarea::placeholder {
          color: #9aa3ad;
        }

        .small-note { font-size:12px; color:var(--muted); margin-top:6px; }

        /* salary area special layout */
        .salary-row {
          display:flex;
          gap:10px;
          align-items:center;
        }
        .salary-row .ranged { display:flex; gap:10px; width:100%; }

        .muted-box {
          padding: 10px 12px;
          border-radius: 8px;
          background: #f8fafb;
          border: 1px solid var(--border);
          color: var(--muted);
          font-size: 13px;
        }

        /* primary / CTA button */
        .btn-primary {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          padding: 10px 16px;
          border-radius: 10px;
          background: linear-gradient(180deg,#2d86c3 0%, #1f5fa0 100%);
          color:#fff;
          border:none;
          font-weight:800;
          cursor:pointer;
          box-shadow: 0 10px 26px rgba(46,108,173,0.12);
        }
        .btn-primary:active { transform: translateY(1px); }

        .form-footer {
          margin-top:20px;
          display:flex;
          justify-content:flex-end;
          gap:12px;
          align-items:center;
        }

        /* small helper */
        .helper { font-size:13px; color:var(--muted); margin-right:auto; }

        /* small visual niceties */
        select { appearance: none; -webkit-appearance:none; -moz-appearance:none; background-image: linear-gradient(45deg, transparent 50%, #9aa3ad 50%), linear-gradient(135deg, #9aa3ad 50%, transparent 50%); background-repeat: no-repeat; background-position: calc(100% - 12px) calc(1em + 2px), calc(100% - 7px) calc(1em + 2px); background-size: 8px 8px, 8px 8px; padding-right: 36px; }

        .row-dates { display:flex; gap:10px; align-items:center; }
        .row-dates label { width:100%; }

        /* subtle responsive spacing for top headline */
        .page-title {
          font-size: 28px; font-weight:800; margin: 0 0 12px 0; color: #0b2545;
        }
      `}</style>

      <div className="pg-container">
        <div className="page-title">Post New Job</div>

        <div className="card-form">
          <div className="form-header">
            <div>
              {/* <h2>New Job Posting</h2> */}
              <div className="form-sub">Create a detailed job listing — applicants will see this information.</div>
            </div>
            {/* <div className="muted-box">Visible to applicants only</div> */}
          </div>

          <form onSubmit={handleJobPost}>
            <div className="form-grid">
              <div className="full-width">
                <label className="input-label">Company Name</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company Name" />
              </div>

              <div>
                <label className="input-label">Job Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job Title" />
              </div>

              <div>
                <label className="input-label">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select Category</option>
                  <option>Graphics & Design</option>
                  <option>Mobile App Development</option>
                  <option>Frontend Web Development</option>
                  <option>Business Development Executive</option>
                  <option>Account & Finance</option>
                  <option>Artificial Intelligence</option>
                  <option>Video Animation</option>
                  <option>MEAN Stack Development</option>
                  <option>MERN Stack Development</option>
                  <option>Data Entry Operator</option>
                </select>
              </div>

              <div>
                <label className="input-label">Country</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
              </div>

              <div>
                <label className="input-label">City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
              </div>

              <div className="full-width">
                <label className="input-label">Location (Optional)</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location, landmark, area" />
              </div>

              <div>
                <label className="input-label">Start Date</label>
                <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div>
                <label className="input-label">End Date</label>
                <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              <div>
                <label className="input-label">Salary Type</label>
                <select value={salaryType} onChange={(e) => setSalaryType(e.target.value)}>
                  <option value="default">Select Salary Type</option>
                  <option value="Fixed Salary">Fixed Salary</option>
                  <option value="Ranged Salary">Ranged Salary</option>
                </select>
              </div>

              <div>
                <label className="input-label">Salary (fixed or range)</label>
                {salaryType === "Fixed Salary" ? (
                  <input type="number" placeholder="Enter Fixed Salary" value={fixedSalary} onChange={(e) => setFixedSalary(e.target.value)} />
                ) : (
                  <div className="salary-row">
                    <div className="ranged">
                      <input type="number" placeholder="Salary From" value={salaryFrom} onChange={(e) => setSalaryFrom(e.target.value)} />
                      <input type="number" placeholder="Salary To" value={salaryTo} onChange={(e) => setSalaryTo(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              <div className="full-width">
                <label className="input-label">Job Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the role, responsibilities and skills required"></textarea>
              </div>

              <div className="full-width">
                <label className="input-label">Skills (comma separated)</label>
                <input type="text" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="React, Node.js, MongoDB" />
                <div className="small-note">Enter skills separated by commas. These are used for matching and search.</div>
              </div>
            </div>

            <div className="form-footer">
              <div className="helper">Tip: Fill as much detail to improve candidate matches</div>
              <button type="submit" className="btn-primary">Create Job</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
