// frontend/src/pages/MyApplications.jsx
import React, { useContext, useEffect, useState } from "react";
import { Context } from "/src/context.jsx";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000/api/v1";
const API_ROOT = "http://localhost:4000";

const MyApplications = () => {
  const { user, isAuthorized } = useContext(Context);
  const [applications, setApplications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [resumeImageUrl, setResumeImageUrl] = useState("");
  const navigateTo = useNavigate();

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
    if (!isAuthorized) {
      navigateTo("/");
      return;
    }

    const load = async () => {
      try {
        let res;
        if (user && user.role === "Employer") {
          res = await axios.get(`${API_BASE}/application/employer/getall`, {
            withCredentials: true,
          });
        } else {
          res = await axios.get(`${API_BASE}/application/jobseeker/getall`, {
            withCredentials: true,
          });
        }

        let apps = res.data.applications || [];

        // Merge with localStorage interviews
        const stored = JSON.parse(localStorage.getItem("scheduledInterviews") || "{}");
        apps = apps.map((app) =>
          stored[app._id] ? { ...app, interview: stored[app._id] } : app
        );

        setApplications(apps);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Could not load");
      }
    };
    load();
  }, [isAuthorized, user, navigateTo]);

  const deleteApplication = async (id) => {
    try {
      const res = await axios.delete(`${API_BASE}/application/delete/${id}`, {
        withCredentials: true,
      });
      toast.success(res.data.message);
      setApplications((prev) => prev.filter((a) => a._id !== id));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  const openModal = (imageUrl) => {
    setResumeImageUrl(imageUrl);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const getResumeUrl = (element) => {
    const candidate = element?.resume?.url || element?.resumePath || "";
    if (!candidate) return "";
    return candidate.startsWith("http") ? candidate : API_ROOT + candidate;
  };

  // Save interview schedule in state + localStorage
  const scheduleInterview = (applicationId, date, time) => {
    if (!date || !time) {
      toast.error("Please select date and time");
      return;
    }

    // Update state
    setApplications((prev) =>
      prev.map((app) =>
        app._id === applicationId ? { ...app, interview: { date, time } } : app
      )
    );

    // Persist in localStorage so job seeker sees it too
    const stored = JSON.parse(localStorage.getItem("scheduledInterviews") || "{}");
    stored[applicationId] = { date, time };
    localStorage.setItem("scheduledInterviews", JSON.stringify(stored));

    toast.success(`Interview scheduled for ${date} at ${time}`);
  };

  return (
    <section className="my_applications page" style={{ "--navbar-height": "72px" }}>
      <style>{`
        :root{ --navbar-height:72px; }

        .my_applications.page {
          padding: calc(var(--navbar-height, 72px) + 36px) 18px 96px;
          background: linear-gradient(180deg, #f7fbff 0%, #eef6fb 60%);
          min-height: calc(100vh - var(--navbar-height, 72px));
          box-sizing: border-box;
          font-family: Inter, "Segoe UI", Roboto, system-ui, -apple-system, "Helvetica Neue", Arial;
        }

        .my_applications .container {
          max-width: 1260px;
          margin: 0 auto;
          padding: 0 10px;
        }

        .my_applications h1 {
          font-size: 34px;
          margin: 6px 0 22px 6px;
          color: #0b2545;
          font-weight: 800;
        }

        .apps-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        @media (max-width: 1100px) {
          .apps-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .apps-grid { grid-template-columns: 1fr; }
        }

        .job_seeker_card {
          display: flex;
          gap: 18px;
          align-items: flex-start;
          background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
          border-radius: 12px;
          padding: 18px;
          border: 1px solid rgba(11,29,44,0.06);
          box-shadow: 0 10px 30px rgba(11,28,50,0.04);
          transition: transform .16s ease, box-shadow .16s ease, background .16s ease;
          min-height: 180px;
        }

        .job_seeker_card:hover {
          transform: translateY(-6px);
          box-shadow: 0 22px 50px rgba(11,28,50,0.08);
          background: linear-gradient(180deg,#f8fbff 0%, #eef7ff 100%);
        }

        .job_seeker_card .detail { flex: 1; min-width: 0; }
        .job_seeker_card .detail p {
          margin: 6px 0;
          font-size: 14px;
          color: #243244;
          line-height: 1.3;
        }
        .job_seeker_card .detail p span {
          font-weight: 700;
          color: #0b2545;
          margin-right: 6px;
        }

        .job_seeker_card .resume {
          width: 220px;
          display:flex;
          flex-direction:column;
          gap:10px;
          align-items:center;
          justify-content:center;
        }
        .job_seeker_card .resume img {
          width: 200px;
          height: 120px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid rgba(11,29,44,0.06);
          box-shadow: 0 8px 18px rgba(11,28,50,0.05);
          cursor: pointer;
          transition: transform .12s ease;
        }
        .job_seeker_card .resume img:hover { transform: scale(1.02); }

        .view-btn {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          padding: 10px 14px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          border: none;
          background: linear-gradient(180deg, #2d86c3 0%, #1f5fa0 100%);
          color: #fff;
          box-shadow: 0 8px 20px rgba(11,29,44,0.08);
          cursor: pointer;
          transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
        }
        .view-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 36px rgba(11,29,44,0.12);
          background: linear-gradient(180deg, #3d95d1 0%, #2568af 100%);
        }

        .btn-area {
          display:flex;
          gap:10px;
          align-items:center;
          justify-content:center;
        }
        .btn-delete {
          background: linear-gradient(180deg,#e25858 0%, #c33c3c 100%);
          color:#fff;
          border:none;
          padding:8px 12px;
          border-radius:10px;
          cursor:pointer;
          font-weight:700;
        }
        .btn-delete:hover { opacity: 0.95; transform: translateY(-1px); }

        @media (max-width: 860px) {
          .job_seeker_card { flex-direction: column; gap:12px; min-height: auto; padding:14px; }
          .job_seeker_card .resume { width: 100%; flex-direction: row; justify-content: space-between; }
          .job_seeker_card .resume img { width: 140px; height: 100px; }
        }

        .no-apps { padding: 36px 0; color: #6b7280; font-size: 16px; text-align:center; }

        .resume-modal .modal-content { border-radius: 10px; overflow: hidden; max-height: 90vh; }
        .resume-modal img { max-height: 80vh; width: 100%; object-fit: contain; display:block; margin: 0 auto; }
      `}</style>

      <div className="container">
        {user && user.role === "Job Seeker" ? (
          <>
            <h1>My Applications</h1>
            {applications.length <= 0 ? (
              <div className="no-apps">No Applications Found</div>
            ) : (
              <div className="apps-grid">
                {applications.map((element) => (
                  <JobSeekerCard
                    element={element}
                    key={element._id}
                    openModal={openModal}
                    getResumeUrl={getResumeUrl}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h1>Applications From Job Seekers</h1>
            {applications.length <= 0 ? (
              <div className="no-apps">No Applications Found</div>
            ) : (
              <div className="apps-grid">
                {applications.map((element) => (
                  <EmployerCard
                    element={element}
                    key={element._id}
                    openModal={openModal}
                    getResumeUrl={getResumeUrl}
                    scheduleInterview={scheduleInterview}
                    deleteApplication={deleteApplication}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {modalOpen && <ResumeModal imageUrl={resumeImageUrl} onClose={closeModal} />}
    </section>
  );
};

export default MyApplications;

/* ---- JobSeekerCard ---- */
const JobSeekerCard = ({ element, openModal, getResumeUrl }) => {
  const resumeUrl = getResumeUrl(element);
  const interview = element.interview || null;
  const ABOUT_TO_HAPPEN_MS = 5 * 60 * 1000;
  const now = new Date();

  let isUnlocked = false;
  if (interview?.date && interview?.time) {
    const scheduled = new Date(`${interview.date}T${interview.time}:00`);
    if (!isNaN(scheduled)) {
      isUnlocked = now.getTime() >= (scheduled.getTime() - ABOUT_TO_HAPPEN_MS);
    }
  }

  return (
    <div className="job_seeker_card">
      <div className="detail">
        <p><span>Name:</span> {element.name}</p>
        <p><span>Email:</span> {element.email}</p>
        <p><span>Phone:</span> {element.phone}</p>
        <p><span>Address:</span> {element.address}</p>
        <p><span>CoverLetter:</span> {element.coverLetter}</p>
      </div>
      <div className="resume">
        {resumeUrl ? (
          /\.(jpe?g|png|webp|gif)$/i.test(resumeUrl) ? (
            <>
              <img src={resumeUrl} alt="resume" onClick={() => openModal(resumeUrl)} />
              <button className="view-btn" onClick={() => openModal(resumeUrl)}>View Resume</button>
            </>
          ) : (
            <a className="view-btn" href={resumeUrl} target="_blank" rel="noreferrer">View Resume</a>
          )
        ) : (
          <div style={{ color: "#6b7280" }}>No resume</div>
        )}

        {interview?.date && interview?.time && (
          <button
            className="view-btn"
            title={`Interview scheduled on ${interview.date} at ${interview.time}`}
            disabled={!isUnlocked}
            style={{ marginTop: 6 }}
          >
            Interview Scheduled
          </button>
        )}
      </div>
    </div>
  );
};

/* ---- EmployerCard ---- */
const EmployerCard = ({ element, openModal, getResumeUrl, scheduleInterview, deleteApplication }) => {
  const resumeUrl = getResumeUrl(element);
  const [showSchedule, setShowSchedule] = useState(false);
  const [date, setDate] = useState(element?.interview?.date || "");
  const [time, setTime] = useState(element?.interview?.time || "");
  const [scheduling, setScheduling] = useState(false);

  const handleSchedule = (e) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error("Please select date and time");
      return;
    }
    setScheduling(true);
    try {
      scheduleInterview(element._id, date, time);
      setShowSchedule(false);
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="job_seeker_card">
      <div className="detail">
        <p><span>Name:</span> {element.name}</p>
        <p><span>Email:</span> {element.email}</p>
        <p><span>Phone:</span> {element.phone}</p>
        <p><span>Address:</span> {element.address}</p>
        <p><span>CoverLetter:</span> {element.coverLetter}</p>
      </div>
      <div className="resume">
        {resumeUrl ? (
          /\.(jpe?g|png|webp|gif)$/i.test(resumeUrl) ? (
            <>
              <img src={resumeUrl} alt="resume" onClick={() => openModal(resumeUrl)} />
              <button className="view-btn" onClick={() => openModal(resumeUrl)}>View Resume</button>
            </>
          ) : (
            <a className="view-btn" href={resumeUrl} target="_blank" rel="noreferrer">View Resume</a>
          )
        ) : (
          <div style={{ color: "#6b7280" }}>No resume</div>
        )}

        <div className="btn-area" style={{ marginTop: 6 }}>
          <button className="btn-delete" onClick={() => deleteApplication(element._id)}>Delete</button>
          <button
            className="view-btn"
            type="button"
            onClick={() => setShowSchedule((s) => !s)}
            style={{ marginLeft: 8 }}
          >
            {showSchedule ? "Cancel" : "Schedule Interview"}
          </button>
        </div>

        {showSchedule && (
          <form className="schedule-area" onSubmit={handleSchedule} style={{ marginTop: 10 }}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            <button className="schedule-submit" type="submit" disabled={scheduling}>
              {scheduling ? "Scheduling..." : "Submit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/* ---- ResumeModal ---- */
const ResumeModal = ({ imageUrl, onClose }) => {
  return (
    <div className="resume-modal" style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000
    }}>
      <div className="modal-content" style={{ position: "relative", width: "92%", maxWidth: 1000, background: "#fff", padding: 18 }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 10, right: 14, fontSize: 20, cursor: "pointer",
          border: "none", background: "transparent"
        }} aria-label="Close modal">✕</button>

        {/\.(jpe?g|png|webp|gif)$/i.test(imageUrl) ? (
          <img src={imageUrl} alt="resume" style={{ width: "100%", height: "auto", borderRadius: 6 }} />
        ) : (
          <div style={{ textAlign: "center", padding: 24 }}>
            <a href={imageUrl} target="_blank" rel="noreferrer" style={{ fontSize: 16, color: "#0b2545" }}>Open resume in new tab</a>
          </div>
        )}
      </div>
    </div>
  );
};
