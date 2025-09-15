// frontend/src/components/Home/Home.jsx
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LandingPage from "../LandingPage/LandingPage";
import { Context } from "/src/context.jsx";
import QuizPopup from "../Auth/QuizPopup.jsx"; // adjust if your path differs

/* Styles */
const gradientBtn = {
  background: "linear-gradient(90deg,#0d6efd,#2b8ecc)",
  color: "#fff",
  border: "none",
  padding: ".7rem 1.25rem",
  borderRadius: 10,
  fontWeight: 700,
  boxShadow: "0 12px 32px rgba(11,97,200,0.12)",
};
const accentText = {
  background: "linear-gradient(90deg,#0d6efd,#5aa9ff)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};
const heroContainer = {
  paddingTop: "100px",
  background: "#f3f8fb",
};
const cardStyle = {
  borderRadius: 14,
  background: "#fff",
  padding: "2rem",
  boxShadow: "0 18px 48px rgba(6,27,62,0.06)",
  border: "1px solid rgba(10,40,80,0.02)",
};

function SeekerHero({ navigate }) {
  return (
    <div style={heroContainer}>
      <section className="container text-center py-5">
        <h1 style={{ fontSize: "clamp(1.8rem, 4.2vw, 3.4rem)", fontWeight: 900, color: "#0b2b52", lineHeight: 1.02 }}>
          Find a <span style={accentText}>job</span> that suits your <span style={accentText}>interests</span> and skills
        </h1>
        <p className="text-muted mt-3" style={{ maxWidth: 980, margin: "0 auto", fontSize: 18 }}>
          Discover job opportunities that match your skills and passions. Create a profile, complete short assessments,
          and get matched to roles that fit your strengths.
        </p>

        <div className="d-flex justify-content-center gap-3 mt-4">
          <button className="btn" style={gradientBtn} onClick={() => navigate("/job/getall")}>
            Browse Jobs
          </button>
          <button className="btn btn-link" onClick={() => document.getElementById("how-seeker")?.scrollIntoView({ behavior: "smooth" })}>
            How it works
          </button>
        </div>

        <div className="mt-4 d-flex justify-content-center gap-3 flex-wrap">
          <div style={{ minWidth: 170, borderRadius: 12, background: "#fff", padding: "12px 18px", boxShadow: "0 10px 28px rgba(6,27,62,0.05)" }}>
            <div style={{ fontWeight: 700 }}>Companies</div>
            <div className="text-muted small">Connect with employers</div>
          </div>
          <div style={{ minWidth: 170, borderRadius: 12, background: "#fff", padding: "12px 18px", boxShadow: "0 10px 28px rgba(6,27,62,0.05)" }}>
            <div style={{ fontWeight: 700 }}>Live Jobs</div>
            <div className="text-muted small">Find active openings</div>
          </div>
          <div style={{ minWidth: 170, borderRadius: 12, background: "#fff", padding: "12px 18px", boxShadow: "0 10px 28px rgba(6,27,62,0.05)" }}>
            <div style={{ fontWeight: 700 }}>Job Seekers</div>
            <div className="text-muted small">Grow your profile</div>
          </div>
        </div>
      </section>

      <section id="how-seeker" className="py-5">
        <div className="container">
          <div style={{ borderRadius: 12, padding: "2.4rem", background: "linear-gradient(90deg, rgba(13,110,253,0.06), rgba(43,142,204,0.03))", textAlign: "center" }}>
            <h2 style={{ fontWeight: 800, color: "#0b2b52" }}>Your Next Career Opportunity Awaits</h2>
            <p className="text-muted" style={{ maxWidth: 900, margin: "0.6rem auto" }}>
              Browse thousands of jobs across industries and locations — tailored to your skills and experience.
            </p>
            <button className="btn" style={{ ...gradientBtn, padding: "0.55rem 1rem" }} onClick={() => navigate("/job/getall")}>Get Started</button>
          </div>

          <div className="row mt-4 g-4">
            <div className="col-md-4">
              <div style={cardStyle}>
                <h5 style={{ fontWeight: 800 }}>Post Jobs (for Employers)</h5>
                <p className="text-muted">Employers post roles with assessments to find the right fit.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div style={cardStyle}>
                <h5 style={{ fontWeight: 800 }}>Assess Skills</h5>
                <p className="text-muted">Short tests help you showcase strengths to employers.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div style={cardStyle}>
                <h5 style={{ fontWeight: 800 }}>Smart Match</h5>
                <p className="text-muted">Get matched to roles that fit your profile and preferences.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function EmployerHero({ navigate }) {
  return (
    <div style={heroContainer}>
      <section className="container text-center py-5">
        <h1 style={{ fontSize: "clamp(1.9rem, 4.2vw, 3.2rem)", fontWeight: 900, color: "#0b2b52", lineHeight: 1.02 }}>
          Find the <span style={accentText}>perfect candidate</span> with the skills you need
        </h1>

        <p className="text-muted mt-3" style={{ maxWidth: 920, margin: "0 auto", fontSize: 18 }}>
          Post a job, add skill assessments, and discover qualified candidates — faster. Manage applications from one dashboard.
        </p>

        <div className="d-flex justify-content-center gap-3 mt-4">
          <button className="btn" style={gradientBtn} onClick={() => navigate("/job/post")}>
            Post a Job
          </button>
          <button className="btn btn-outline-primary" onClick={() => navigate("/dashboard")}>
            View Dashboard
          </button>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div style={{ borderRadius: 12, padding: "2.2rem", background: "linear-gradient(90deg, rgba(13,110,253,0.06), rgba(43,142,204,0.03))", textAlign: "center" }}>
            <h2 style={{ fontWeight: 800, color: "#0b2b52" }}>Hire faster with skill-based matching</h2>
            <p className="text-muted" style={{ maxWidth: 900, margin: "0.6rem auto" }}>
              Add assessments to your job posts, review candidate results, and make data-driven hiring decisions.
            </p>
            <button className="btn" style={{ ...gradientBtn, padding: "0.55rem 1rem" }} onClick={() => navigate("/job/post")}>Post a job</button>
          </div>

          <div className="row mt-4 g-4">
            <div className="col-md-4">
              <div style={cardStyle}>
                <h5 style={{ fontWeight: 800 }}>Post & Manage Jobs</h5>
                <p className="text-muted">Create rich job posts with timelines and assessments.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div style={cardStyle}>
                <h5 style={{ fontWeight: 800 }}>Review Candidates</h5>
                <p className="text-muted">See applications and assessment scores in one place.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div style={cardStyle}>
                <h5 style={{ fontWeight: 800 }}>Fast Shortlisting</h5>
                <p className="text-muted">Filter candidates by skills, score, and experience.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  const { isAuthorized, user } = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      window.__APP_DEBUG = { isAuthorized, user };
      console.debug("[Home] __APP_DEBUG set", window.__APP_DEBUG);
    } catch (e) {}
  }, [isAuthorized, user]);

  // if not logged in, show public landing page
  if (!isAuthorized) return <LandingPage />;

  const role = String(user?.role || "").toLowerCase();
  const isJobSeeker = role.includes("seeker") || role.includes("job") || role.includes("candidate");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* main content grows */}
      <div style={{ flex: 1 }}>
        {isJobSeeker ? <SeekerHero navigate={navigate} /> : <EmployerHero navigate={navigate} />}
        {/* Mount the quiz popup — it will self-decide whether to show */}
        <QuizPopup />
      </div>

      {/* Footer pinned to bottom */}
      <footer >
       
      </footer>
    </div>
  );
}
