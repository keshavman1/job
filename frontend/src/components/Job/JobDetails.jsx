import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Context } from "/src/context.jsx";
// removed external CSS import per your request: styles are inlined below

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api/v1";

function getCountdownString(futureDate) {
  const diff = new Date(futureDate) - new Date();
  if (isNaN(diff)) return null;
  if (diff <= 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours}h ${mins}m ${secs}s`;
}

const JobDetails = () => {
  const { id } = useParams();
  const { isAuthorized, user } = useContext(Context);
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        console.log("[JobDetails] fetching job", id);
        const res = await axios.get(`${API_BASE}/job/${id}`, { withCredentials: true });
        const fetched = res?.data?.job;
        console.log("[JobDetails] fetched job:", fetched);
        if (!cancelled) {
          setJob(fetched || null);
          if (fetched && Array.isArray(fetched.applicants) && user && user._id) {
            const applicants = fetched.applicants.map(a => (typeof a === "string" ? a : (a && a._id ? String(a._id) : String(a))));
            setAlreadyApplied(applicants.includes(String(user._id)));
          } else {
            setAlreadyApplied(false);
          }
        }
      } catch (err) {
        console.error("[JobDetails] failed to fetch job:", err);
        if (!cancelled) navigate("/notfound");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id, user, navigate]);

  // redirect to login if not authorized
  useEffect(() => {
    if (!isAuthorized) {
      navigate("/login");
    }
  }, [isAuthorized, navigate]);

  // countdown tick for re-rendering countdowns
  const [, tick] = useState(0);
  useEffect(() => {
    const idt = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(idt);
  }, []);

  // Inline styles block (keeps everything in this file)
  const InlineStyles = () => (
    <style>{`
      /* Ensure page spacing so navbar doesn't overlap content */
      .jobDetail.page {
        padding-top: 92px; /* big enough to clear most navbars; adjust if your navbar is taller */
        padding-bottom: 48px;
        min-height: calc(100vh - 92px);
        background: #f8fbfd; /* subtle off-white */
        box-sizing: border-box;
        font-family: Inter, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        color: #16324f;
      }

      .jobDetail .container {
        max-width: 980px;
        margin: 0 auto;
        padding: 20px;
      }

      .jobDetail h3 {
        text-align: center;
        font-size: 28px;
        margin-bottom: 18px;
        color: #0b3a63;
        font-weight: 700;
        letter-spacing: 0.2px;
      }

      .jobDetail .banner {
        background: linear-gradient(180deg, rgba(224,241,253,0.9) 0%, rgba(245,251,255,0.9) 100%);
        border: 1px solid rgba(11,58,99,0.06);
        box-shadow: 0 8px 24px rgba(11,58,99,0.06);
        padding: 26px;
        border-radius: 12px;
        display: block;
        gap: 12px;
      }

      /* Row style for each field (label + value) */
      .jobDetail .field {
        display: flex;
        gap: 14px;
        align-items: flex-start;
        margin: 12px 0;
      }
      .jobDetail .label {
        min-width: 160px;
        font-weight: 700;
        color: #0b3a63;
        font-size: 16px;
      }
      .jobDetail .value {
        flex: 1;
        font-size: 15px;
        color: #16324f;
        line-height: 1.4;
        word-break: break-word;
      }

      /* smaller screens adjustments */
      @media (max-width: 600px) {
        .jobDetail .label {
          min-width: 120px;
          font-size: 14px;
        }
        .jobDetail h3 { font-size: 22px; }
      }

      /* Countdown and status */
      .jobDetail .status {
        margin-top: 14px;
        font-weight: 700;
      }
      .jobDetail .opens { color: #0b5c92; } /* blue */
      .jobDetail .closes { color: #b02e2e; } /* reddish for closing urgency */
      .jobDetail .notice {
        font-weight: 700;
        margin-top: 8px;
      }

      /* Apply button */
      .jobDetail .actions {
        margin-top: 20px;
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .apply-btn {
        display: inline-block;
        background: linear-gradient(90deg, #0b67a6, #0e89d6);
        color: #fff;
        padding: 10px 18px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 700;
        box-shadow: 0 6px 18px rgba(14,137,214,0.18);
        transition: transform 140ms ease, box-shadow 140ms ease;
      }
      .apply-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 30px rgba(14,137,214,0.18);
      }
      .apply-btn[disabled], .apply-btn.disabled {
        opacity: 0.6;
        pointer-events: none;
      }

      /* Secondary disabled button style (plain button) */
      .jobDetail button[disabled] {
        background: transparent;
        border: 1px solid rgba(11,58,99,0.06);
        color: rgba(11,58,99,0.6);
        padding: 10px 14px;
        border-radius: 6px;
      }

      /* small helper text */
      .small {
        font-size: 13px;
        color: #2a516d;
      }
    `}</style>
  );

  if (loading) return (
    <div className="jobDetail page">
      <InlineStyles />
      <div className="container"><p>Loading job…</p></div>
    </div>
  );
  if (!job) return (
    <div className="jobDetail page">
      <InlineStyles />
      <div className="container"><p>Job not found.</p></div>
    </div>
  );

  const now = new Date();
  const start = job.startDate ? new Date(job.startDate) : null;
  const end = job.endDate ? new Date(job.endDate) : null;

  const notOpenedYet = start && start > now;
  const closed = job.expired || (end && end < now);
  const active = !notOpenedYet && !closed;

  // Helper to render salary cleanly
  const salaryDisplay = job.fixedSalary ? job.fixedSalary : `${job.salaryFrom || ""}${job.salaryFrom && job.salaryTo ? " - " : ""}${job.salaryTo || ""}` || "Not specified";

  return (
    <section className="jobDetail page" aria-labelledby="job-details-heading">
      <InlineStyles />
      <div className="container">
        <h3 id="job-details-heading">Job Details</h3>

        <div className="banner" role="region" aria-label="Job information card">
          <div className="field">
            <div className="label">Title:</div>
            <div className="value"><strong>{job.title}</strong></div>
          </div>

          <div className="field">
            <div className="label">Company:</div>
            <div className="value"><strong>{job.companyName || "Unknown Company"}</strong></div>
          </div>

          <div className="field">
            <div className="label">Category:</div>
            <div className="value">{job.category || "Not specified"}</div>
          </div>

          <div className="field">
            <div className="label">Location:</div>
            <div className="value">{job.country || "N/A"}{job.city ? ` / ${job.city}` : ""}{job.location ? ` - ${job.location}` : ""}</div>
          </div>

          <div className="field">
            <div className="label">Description:</div>
            <div className="value">{job.description || "No description provided."}</div>
          </div>

          <div className="field">
            <div className="label">Salary:</div>
            <div className="value">{salaryDisplay}</div>
          </div>

          <div className="field">
            <div className="label">Skills:</div>
            <div className="value">{Array.isArray(job.skills) ? job.skills.join(", ") : (job.skills || "Not specified")}</div>
          </div>

          <div className="field">
            <div className="label">Active window:</div>
            <div className="value small">
              {start ? new Date(start).toLocaleString() : "N/A"} → {end ? new Date(end).toLocaleString() : "N/A"}
            </div>
          </div>

          <div className="status">
            {notOpenedYet && (
              <div className="notice opens">Opens in: {getCountdownString(start) || "soon"}</div>
            )}

            {active && end && (
              <div className="notice closes">Closes in: {getCountdownString(end) || "soon"}</div>
            )}

            {closed && (
              <div className="notice" style={{ color: "#b02e2e" }}>This job is closed. You cannot apply.</div>
            )}
          </div>

          <div className="actions" aria-live="polite">
            {user && user.role === "Employer" ? (
              <div className="small">You are an employer (employer actions are on the dashboard).</div>
            ) : notOpenedYet ? (
              <div><button disabled>Apply (Will open later)</button></div>
            ) : closed ? (
              <div><button disabled>Apply (Closed)</button></div>
            ) : alreadyApplied ? (
              <div className="small" style={{ color: "#2a516d" }}>You have already applied to this job.</div>
            ) : (
              <Link to={`/application/${job._id}`} className="apply-btn">Apply Now</Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default JobDetails;
