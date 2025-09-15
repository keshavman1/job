// frontend/src/components/LandingPage/LandingPage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const statTemplates = [
  { key: "companies", label: "Companies" },
  { key: "liveJobs", label: "Live Jobs" },
  { key: "jobSeekers", label: "Job Seekers" },
  { key: "employers", label: "Employers" },
];

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-page">
      {/* No navbar here — your App already renders Navbar */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="row align-items-center gx-5">
            <div className="col-lg-6 hero-left">
              <h1 className="hero-title">
                Find a job that <span className="accent">fits your skills</span> & passions
              </h1>

              <p className="hero-sub">
                JobNest connects talented professionals with companies that value real skills.
                Create a profile, take short assessments, and get matched to jobs that suit you.
              </p>

              <div className="hero-cta">
                <button className="btn hero-btn" onClick={() => navigate("/login")}>
                  Get Started
                </button>
                <a href="#how" className="hero-link">How it works</a>
              </div>

              <div className="stat-row mt-4">
                {statTemplates.map((s) => (
                  <div className="stat-pill" key={s.key}>
                    <div className="stat-pill-left">
                      <div className="stat-dot" />
                      <div className="stat-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-6 hero-right">
              {/* Use image from public folder so no import required */}
              <div className="hero-image-wrap">
                <img src="/heroS.jpg" alt="hero" className="hero-image" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="how-section py-5">
        <div className="container">
          <h2 className="section-title text-center">How Career Connect Works</h2>
          <p className="section-lead text-center">
            Post jobs, assess skills, and get fast matches — simple, fast, and effective.
          </p>

          <div className="row g-4 mt-4">
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">📣</div>
                <h5>Post Jobs</h5>
                <p>Employers post detailed job descriptions with assessments and timelines.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">🧾</div>
                <h5>Assess Skills</h5>
                <p>Candidates can showcase skills through short tests and verified profiles.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h5>Smart Match</h5>
                <p>Real-time matching and filters help you find the right candidate fast.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-band py-5 text-center">
        <div className="container">
          <h3>Ready to level up your career?</h3>
          <button className="btn hero-btn-outline" onClick={() => navigate("/register")}>
            Create an account — it's free
          </button>
        </div>
      </section>

      <footer className="landing-footer py-4 text-center">
        <div className="container">
          <small>© {new Date().getFullYear()} JobNest</small>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
