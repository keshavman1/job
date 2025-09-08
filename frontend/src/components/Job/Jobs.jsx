// frontend/src/pages/Jobs.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { Context } from "/src/context.jsx";
import "./jobs.css";

const API_BASE = "http://localhost:4000/api/v1";

const Jobs = () => {
  const [allJobs, setAllJobs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef(null);

  const { isAuthorized, user } = useContext(Context);
  const location = useLocation();

  // MAIN LOADER
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        console.log("[Jobs] user from context:", user);

        const params = new URLSearchParams(location.search);
        const urlSkillsParam = params.get("skills"); // comma separated

        let finalSkillsParam = "";
        if (urlSkillsParam && urlSkillsParam.trim().length > 0) {
          finalSkillsParam = urlSkillsParam;
        } else if (user && Array.isArray(user.skills) && user.skills.length > 0) {
          finalSkillsParam = user.skills.map(s => String(s).trim()).filter(Boolean).join(",");
        }

        console.log("[Jobs] finalSkillsParam:", finalSkillsParam);

        const url = `${API_BASE}/job/getall${finalSkillsParam ? `?skills=${encodeURIComponent(finalSkillsParam)}` : ""}`;
        console.log("[Jobs] GET", url);

        const res = await axios.get(url, { withCredentials: true, timeout: 10000 });
        console.log("[Jobs] API response:", res && res.data ? res.data : res);

        const returnedJobs = (res.data && res.data.jobs) ? res.data.jobs : [];

        if (finalSkillsParam && finalSkillsParam.trim().length > 0) {
          const requested = finalSkillsParam.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

          const strictlyFiltered = returnedJobs.filter(job => {
            if (!job.skills || !Array.isArray(job.skills) || job.skills.length === 0) return false;
            const jobSkills = job.skills.map(s => String(s || "").trim().toLowerCase()).filter(Boolean);
            const intersect = jobSkills.filter(js => requested.some(r => js.includes(r) || r.includes(js) || js === r));
            return intersect.length > 0;
          });

          if (!cancelled) {
            setAllJobs(strictlyFiltered);
            setJobs(strictlyFiltered);
          }
        } else {
          if (!cancelled) {
            setAllJobs(returnedJobs);
            setJobs(returnedJobs);
          }
        }
      } catch (error) {
        console.error("[Jobs] Failed to load jobs:", error);
        if (error?.response) console.error("[Jobs] error.response.data:", error.response.data);
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

  // Debounce search
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
    const filtered = allJobs.filter(job => {
      if (!job || !job.title) return false;
      const title = String(job.title).trim().toLowerCase();
      return title.includes(debouncedQuery);
    });
    setJobs(filtered);
  }, [debouncedQuery, allJobs]);

  // If not authorized, we do NOT auto-redirect; render message instead
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

  const params = new URLSearchParams(location.search);
  const skillsInUrl = params.get("skills");
  const hasFilter = Boolean((skillsInUrl && skillsInUrl.trim().length > 0) || (user && Array.isArray(user.skills) && user.skills.length > 0));

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

            {hasFilter ? <div className="filter-chip">Filtered by skills</div> : null}
          </div>
        </div>
      </div>

      <div className="jobs-container">
        {loading ? (
          <div className="jobs-empty"><p>Loading jobs…</p></div>
        ) : (
          <>
            {jobs.length === 0 ? (
              <div className="jobs-empty">
                {hasFilter ? (
                  debouncedQuery ? <p>No jobs match your search and skills. Try a broader title or remove skills filter.</p>
                  : <p>No jobs match your skills. Try broadening your skills or check back later.</p>
                ) : (
                  debouncedQuery ? <p>No jobs match your search. Try a broader title or remove search text.</p>
                  : <p>No jobs available at the moment. Please check again later.</p>
                )}
              </div>
            ) : (
              <div className="jobs-grid">
                {jobs.map(job => (
                  <article key={job._id} className="job-card">
                    <div className="card-top">
                      <h3 className="job-title">{job.title}</h3>
                      <p className="job-category">{job.category}</p>
                    </div>
                    <div className="card-body">
                      <p className="job-location">{job.country || "Location not specified"}</p>
                      <p className="job-snippet">{(job.description || "").slice(0, 120)}{(job.description || "").length > 120 ? "…" : ""}</p>
                    </div>
                    <div className="card-footer">
                      <div className="job-skills">
                        {job.skills && job.skills.length ? job.skills.slice(0, 5).map((s, i) => (
                          <span key={i} className="skill-pill">{s}</span>
                        )) : <span className="no-skills">No skills listed</span>}
                      </div>
                      <Link to={`/job/${job._id}`} className="details-btn">Job Details</Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Jobs;
