import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { Context } from "/src/context.jsx";
import "./jobs.css";

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

/**
 * Jobs list: shows jobs even before start.
 * - if startDate > now => shows "Opens in: ..."
 * - if active (now within start..end) => shows Job Details link and also "Closes in: ..."
 * - if expired or endDate < now => shows Closed
 *
 * Debug logs included.
 */
const Jobs = () => {
  const [allJobs, setAllJobs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef(null);
  const { isAuthorized, user } = useContext(Context);
  const location = useLocation();

  // re-render every second for countdowns
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        console.log("[Jobs] loading jobs; user:", user && user._id);
        const params = new URLSearchParams(location.search);
        const urlSkillsParam = params.get("skills");

        let finalSkillsParam = "";
        if (urlSkillsParam && urlSkillsParam.trim()) {
          finalSkillsParam = urlSkillsParam;
        } else if (user && Array.isArray(user.skills) && user.skills.length) {
          finalSkillsParam = user.skills.map((s) => String(s).trim()).filter(Boolean).join(",");
        }

        const url = `${API_BASE}/job/getall${finalSkillsParam ? `?skills=${encodeURIComponent(finalSkillsParam)}` : ""}`;
        console.log("[Jobs] GET URL:", url);

        const res = await axios.get(url, { withCredentials: true, timeout: 10000 });
        const returnedJobs = (res && res.data && Array.isArray(res.data.jobs)) ? res.data.jobs : [];
        console.log("[Jobs] API returned jobs count:", returnedJobs.length);

        if (!cancelled) {
          setAllJobs(returnedJobs);
          setJobs(returnedJobs);
        }
      } catch (err) {
        console.error("[Jobs] Failed to fetch jobs:", err);
        if (err?.response) console.error("[Jobs] server response:", err.response.data);
        if (!cancelled) {
          setAllJobs([]);
          setJobs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [location.search, user]);

  // debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 280);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery) {
      setJobs(allJobs);
      return;
    }
    const filtered = allJobs.filter((job) => {
      if (!job || !job.title) return false;
      return String(job.title).toLowerCase().includes(debouncedQuery);
    });
    setJobs(filtered);
  }, [debouncedQuery, allJobs]);

  if (!isAuthorized) {
    return (
      <section className="jobs-page">
        <div className="jobs-hero">
          <div className="jobs-hero-inner">
            <h1 className="jobs-title">All Available Jobs</h1>
            <p style={{ color: "#888" }}>Please login to see jobs matched to your skills.</p>
          </div>
        </div>
      </section>
    );
  }

  const clearSearch = () => { setSearchQuery(""); setDebouncedQuery(""); };

  return (
    <section className="jobs-page">
      <div className="jobs-hero">
        <div className="jobs-hero-inner">
          <h1 className="jobs-title">All Available Jobs</h1>
          <div className="search-row">
            <div className="search-box">
              <input
                aria-label="Search jobs by title"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by job title — e.g. Frontend Developer, Data Entry..."
              />
              {searchQuery ? <button onClick={clearSearch}>✕</button> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="jobs-container">
        {loading ? (
          <div className="jobs-empty"><p>Loading jobs…</p></div>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => {
              // defensive: ensure job object present
              if (!job || !job._id) return null;

              const now = new Date();
              const start = job.startDate ? new Date(job.startDate) : null;
              const end = job.endDate ? new Date(job.endDate) : null;

              const notOpenedYet = start && start > now;
              const closed = job.expired || (end && end < now);
              const active = !notOpenedYet && !closed;

              // debug log per job (won't spam too much because it's on render; you can add a flag if needed)
              // console.debug(`[Jobs] jobId=${job._id} start=${start} end=${end} notOpened=${notOpenedYet} active=${active} closed=${closed}`);

              return (
                <article key={job._id} className="job-card">
                  <div className="card-top">
                    <h3 className="job-title">{job.title}</h3>
                    <p className="job-category">{job.category}</p>
                  </div>

                  <div className="card-body">
                    <p className="job-company">{job.companyName || "Unknown Company"}</p>
                    <p className="job-location">{job.country || "Location not specified"}</p>
                    <p className="job-snippet">
                      {(job.description || "").slice(0, 120)}
                      {(job.description || "").length > 120 ? "…" : ""}
                    </p>
                  </div>

                  <div className="card-footer">
                    {notOpenedYet ? (
                      <>
                        <span className="job-pending">Opens in: {getCountdownString(start) || "soon"}</span>
                        {/* still show when it closes once active */}
                        {end ? <div className="job-meta">Closes at: {end.toLocaleString()}</div> : null}
                      </>
                    ) : closed ? (
                      <>
                        <span className="job-closed">Closed</span>
                        {end ? <div className="job-meta">Closed at: {end.toLocaleString()}</div> : null}
                      </>
                    ) : (
                      <>
                        <Link to={`/job/${job._id}`} className="details-btn">Job Details</Link>
                        {end ? <div className="job-meta">Closes in: {getCountdownString(end) || "soon"}</div> : null}
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Jobs;
