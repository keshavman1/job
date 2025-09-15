// frontend/src/pages/MyJobs.jsx
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import { Context } from "/src/context.jsx";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api/v1";

const MyJobs = () => {
  const [myJobs, setMyJobs] = useState([]);
  const [editingMode, setEditingMode] = useState(null);
  const { isAuthorized, user } = useContext(Context);
  const navigate = useNavigate();

  // Inject Bootstrap once
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

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/job/getmyjobs`, { withCredentials: true });
        setMyJobs(data.myJobs || []);
      } catch (err) {
        console.error("[MyJobs] error fetching:", err);
        toast.error(err?.response?.data?.message || err.message || "Failed to fetch");
        setMyJobs([]);
      }
    };
    fetchJobs();
  }, []);

  if (!isAuthorized || (user && user.role !== "Employer")) {
    navigate("/");
    return null;
  }

  const handleEnableEdit = (jobId) => setEditingMode(jobId);
  const handleDisableEdit = () => setEditingMode(null);

  const handleInputChange = (jobId, field, value) => {
    setMyJobs((prev) => prev.map((j) => (j._id === jobId ? { ...j, [field]: value } : j)));
  };

  const normalizeSkillsForSend = (s) => {
    if (!s) return [];
    if (Array.isArray(s)) return s.map((x) => String(x).trim()).filter(Boolean);
    return String(s).split(",").map((x) => x.trim()).filter(Boolean);
  };

  const handleUpdateJob = async (jobId) => {
    try {
      const updatedJob = myJobs.find((job) => job._id === jobId);
      if (!updatedJob) return;

      const payload = { ...updatedJob };
      payload.skills = normalizeSkillsForSend(payload.skills);

      if (payload.startDate && payload.startDate instanceof Date) payload.startDate = payload.startDate.toISOString();
      if (payload.endDate && payload.endDate instanceof Date) payload.endDate = payload.endDate.toISOString();

      await axios.put(`${API_BASE}/job/update/${jobId}`, payload, { withCredentials: true });
      toast.success("Job Updated!");
      setEditingMode(null);
      setMyJobs((prev) => prev.map((j) => (j._id === jobId ? { ...j, skills: payload.skills } : j)));
    } catch (err) {
      console.error("[MyJobs] update failed:", err);
      toast.error(err?.response?.data?.message || err.message || "Update failed");
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await axios.delete(`${API_BASE}/job/delete/${jobId}`, { withCredentials: true });
      toast.success("Job Deleted!");
      setMyJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch (err) {
      console.error("[MyJobs] delete failed:", err);
      toast.error(err?.response?.data?.message || err.message || "Delete failed");
    }
  };

  return (
    <div className="myJobs page" style={{ "--navbar-height": "72px" }}>
      <style>{`
        :root {
          --navbar-height: 72px;
          --outer-blue: #9fc1db; /* outer card color */
          --outer-blue-dark: #83accf;
          --inner-panel: #e9f4fb;
          --muted: #6b7280;
          --text: #0b2545;
          --card-border: rgba(11,29,44,0.06);
        }

        .myJobs.page {
          padding: calc(var(--navbar-height) + 26px) 18px 80px;
          background: linear-gradient(180deg, #f6fbff 0%, #eef6fb 60%);
          min-height: calc(100vh - var(--navbar-height));
          box-sizing: border-box;
          font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
          color: var(--text);
        }

        .myJobs .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .myJobs h1 {
          text-align: center;
          font-size: 34px;
          margin: 6px 0 26px 0;
          font-weight: 800;
          color: var(--outer-blue-dark);
        }

        /* 3-column grid that collapses to 2/1 */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 26px;
          align-items: start;
        }
        @media (max-width: 1100px) {
          .cards-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 700px) {
          .cards-grid { grid-template-columns: 1fr; }
        }

        /* outer card - FIXED height so each card is uniform and compact */
        .job-outer {
          border-radius: 18px;
          padding: 14px;
          background: linear-gradient(180deg, var(--outer-blue) 0%, var(--outer-blue-dark) 100%);
          box-shadow: 0 12px 30px rgba(11,28,50,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          height: 480px; /* fixed height for every card */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        /* inner lighter panel that contains the form inputs - scrollable */
        .job-inner {
          background: var(--inner-panel);
          border-radius: 12px;
          padding: 14px;
          border: 1px solid rgba(255,255,255,0.6);
          box-shadow: inset 0 2px 6px rgba(255,255,255,0.5);
          flex: 1 1 auto;
          overflow: auto;
          max-height: calc(100% - 86px); /* reserve space for bottom action bar (approx 86px) */
        }

        /* nice custom scrollbar for inner panel */
        .job-inner::-webkit-scrollbar { width:10px; }
        .job-inner::-webkit-scrollbar-track { background: transparent; border-radius: 8px; }
        .job-inner::-webkit-scrollbar-thumb { background: rgba(11,28,50,0.08); border-radius: 8px; box-shadow: inset 0 0 0 4px rgba(255,255,255,0.65); }
        .job-inner { scrollbar-width: thin; scrollbar-color: rgba(11,28,50,0.08) transparent; }

        .job-inner .field {
          margin-bottom: 12px;
        }
        .job-inner label {
          display:block;
          font-weight:700;
          font-size:14px;
          margin-bottom:6px;
          color: #082033;
        }
        .job-inner input[type="text"], .job-inner input[type="number"], .job-inner select, .job-inner textarea {
          width:100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid rgba(11,29,44,0.06);
          font-size: 14px;
          background: #fff;
          color: #082033;
          box-shadow: 0 6px 16px rgba(11,28,50,0.04);
        }
        .job-inner textarea { min-height: 80px; resize: vertical; }

        /* bottom bar inside outer card for actions */
        .job-bottom {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .btn-edit {
          background: rgba(255,255,255,0.9);
          color: #08304a;
          border: none;
          padding: 8px 18px;
          border-radius: 10px;
          font-weight:700;
          box-shadow: 0 8px 18px rgba(11,28,50,0.08);
          cursor: pointer;
        }

        .btn-delete {
          background: linear-gradient(180deg,#e25757 0%, #c93c3c 100%);
          color: #fff;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          font-weight:700;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(201,60,60,0.14);
        }

        /* small icon buttons when editing (check/cross) */
        .icon-row { display:flex; gap:8px; align-items:center; }
        .icon-btn {
          width:36px; height:36px; border-radius:8px; display:inline-flex; align-items:center; justify-content:center;
          border:none; cursor:pointer; box-shadow: 0 6px 14px rgba(11,28,50,0.04);
        }
        .icon-check { background: #2d86c3; color:white; }
        .icon-cancel { background: rgba(255,255,255,0.9); color:#082033; }

        .job-inner input[disabled], .job-inner textarea[disabled], .job-inner select[disabled] {
          background: rgba(255,255,255,0.95);
          color: #0b2545;
          opacity: 1;
        }

        @media (max-width: 520px) {
          .job-outer { padding: 12px; height: 520px; } /* slightly taller on narrow screens for usability */
          .job-inner { padding: 10px; }
        }
      `}</style>

      <div className="container">
        <h1>Your Posted Jobs</h1>

        {myJobs.length > 0 ? (
          <div className="cards-grid">
            {myJobs.map((job) => (
              <div className="job-outer" key={job._id}>
                <div className="job-inner" aria-hidden={editingMode !== job._id ? "true" : "false"}>
                  <div className="field">
                    <label>Job Title :</label>
                    <input
                      type="text"
                      disabled={editingMode !== job._id}
                      value={job.title || ""}
                      onChange={(e) => handleInputChange(job._id, "title", e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label>Country:</label>
                    <input
                      type="text"
                      disabled={editingMode !== job._id}
                      value={job.country || ""}
                      onChange={(e) => handleInputChange(job._id, "country", e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label>City:</label>
                    <input
                      type="text"
                      disabled={editingMode !== job._id}
                      value={job.city || ""}
                      onChange={(e) => handleInputChange(job._id, "city", e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label>Category:</label>
                    <select
                      disabled={editingMode !== job._id}
                      value={job.category || ""}
                      onChange={(e) => handleInputChange(job._id, "category", e.target.value)}
                    >
                      <option value="">Select</option>
                      <option>Graphics & Design</option>
                      <option>Mobile App Development</option>
                      <option>Frontend Web Development</option>
                      <option>MERN Stack Development</option>
                      <option>Account & Finance</option>
                      <option>Artificial Intelligence</option>
                      <option>Video Animation</option>
                      <option>MEAN Stack Development</option>
                      <option>Data Entry Operator</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Salary:</label>
                    {job.fixedSalary ? (
                      <input
                        type="number"
                        disabled={editingMode !== job._id}
                        value={job.fixedSalary || ""}
                        onChange={(e) => handleInputChange(job._id, "fixedSalary", e.target.value)}
                      />
                    ) : (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="number"
                          disabled={editingMode !== job._id}
                          value={job.salaryFrom || ""}
                          onChange={(e) => handleInputChange(job._id, "salaryFrom", e.target.value)}
                          placeholder="From"
                        />
                        <input
                          type="number"
                          disabled={editingMode !== job._id}
                          value={job.salaryTo || ""}
                          onChange={(e) => handleInputChange(job._id, "salaryTo", e.target.value)}
                          placeholder="To"
                        />
                      </div>
                    )}
                  </div>

                  <div className="field">
                    <label>Skills:</label>
                    <input
                      type="text"
                      disabled={editingMode !== job._id}
                      value={Array.isArray(job.skills) ? job.skills.join(", ") : (job.skills || "")}
                      onChange={(e) => handleInputChange(job._id, "skills", e.target.value)}
                      placeholder="Comma separated (React, Node.js)"
                    />
                  </div>

                  <div className="field">
                    <label>Description:</label>
                    <textarea
                      disabled={editingMode !== job._id}
                      value={job.description || ""}
                      onChange={(e) => handleInputChange(job._id, "description", e.target.value)}
                    />
                  </div>
                </div>

                <div className="job-bottom">
                  <div>
                    {editingMode === job._id ? (
                      <div className="icon-row">
                        <button className="icon-btn icon-check" onClick={() => handleUpdateJob(job._id)} title="Save">
                          <FaCheck />
                        </button>
                        <button className="icon-btn icon-cancel" onClick={() => handleDisableEdit()} title="Cancel">
                          <RxCross2 />
                        </button>
                      </div>
                    ) : (
                      <button className="btn-edit" onClick={() => handleEnableEdit(job._id)}>Edit</button>
                    )}
                  </div>

                  <div>
                    <button className="btn-delete" onClick={() => handleDeleteJob(job._id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
            You've not posted any job or you deleted all of your jobs!
          </div>
        )}
      </div>
    </div>
  );
};

export default MyJobs;
