// frontend/src/components/Auth/QuizPopup.jsx
import React, { useEffect, useState, useContext } from "react";
import { Context } from "/src/context.jsx";

/**
 * QuizPopup component
 * - shows a sequential 10-question single-choice quiz for new Job Seeker users
 * - posts answers to backend (BASE from VITE_API_URL or fallback)
 * - downloads CSV report if returned
 * - navigates (hard redirect) to http://localhost:5173/job/getall?skills=...
 *
 * Shows only once per user:
 *  - checks server-side flag user.quizCompleted
 *  - checks localStorage key 'quiz_shown_<userId>' to avoid re-showing
 */

const QUESTIONS = [
  { id: "q1", q: "Which front-end library are you most proficient in?", options: ["React", "Angular", "Vue", "None"] },
  { id: "q2", q: "Which database are you most comfortable with?", options: ["MongoDB", "MySQL", "Postgres", "None"] },
  { id: "q3", q: "Which back-end runtime do you prefer?", options: ["Node.js", "Django", "Spring", "None"] },
  { id: "q4", q: "Which language do you prefer?", options: ["C++", "Java", "C", "Python"] },
  { id: "q5", q: "Do you prefer working independently or in teams?", options: ["Independently", "Team", "Both", "Depends"] },
  { id: "q6", q: "How do you approach tight deadlines?", options: ["Plan & Deliver", "Work Overtime", "Ask for Help", "Negotiate Scope"] },
  { id: "q7", q: "How comfortable are you giving/receiving feedback?", options: ["Very", "Somewhat", "Neutral", "Not Comfortable"] },
  { id: "q8", q: "Preferred company size?", options: ["Startup", "SME", "Large Enterprise", "No Preference"] },
  { id: "q9", q: "Work location preference?", options: ["Remote", "Hybrid", "On-site", "Flexible"] },
  { id: "q10", q: "Desired pace of work?", options: ["Fast", "Moderate", "Slow", "Depends on Role"] },
];

export default function QuizPopup() {
  const { isAuthorized, user } = useContext(Context) || {};
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]); // [{ qId, answer }]
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [lastSkillsSelected, setLastSkillsSelected] = useState([]);

  // helper localStorage key per user
  const storageKey = user && user._id ? `quiz_shown_${user._id}` : null;

  useEffect(() => {
    // Show only if:
    // - user is authorized
    // - user.role === "Job Seeker"
    // - server-side flag user.quizCompleted is falsy
    // - AND we haven't shown it before on this client (localStorage)
    let t;
    try {
      const shown = storageKey ? localStorage.getItem(storageKey) === "1" : false;
      if (isAuthorized && user && user.role === "Job Seeker" && !user.quizCompleted && !shown) {
        t = setTimeout(() => {
          setVisible(true);
          // mark that we showed it (prevents re-showing this session even if user navigates away)
          if (storageKey) localStorage.setItem(storageKey, "1");
        }, 2000);
      }
    } catch (e) {
      // if localStorage is disabled or error occurs, just proceed without persisting but show once per page load
      if (isAuthorized && user && user.role === "Job Seeker" && !user.quizCompleted) {
        t = setTimeout(() => setVisible(true), 2000);
      }
    }
    return () => clearTimeout(t);
  }, [isAuthorized, user, storageKey]);

  if (!visible) return null;

  const q = QUESTIONS[current];

  const choose = (opt) => setSelected(opt);

  const next = () => {
    if (!selected) return;
    const nextAnswers = [...answers, { qId: q.id, answer: selected }];
    setAnswers(nextAnswers);
    setSelected(null);
    if (current + 1 < QUESTIONS.length) {
      setCurrent(current + 1);
    } else {
      submitQuiz(nextAnswers);
    }
  };

  const prev = () => {
    if (current === 0) return;
    const newAnswers = answers.slice(0, -1);
    setAnswers(newAnswers);
    setCurrent(current - 1);
    setSelected(newAnswers[newAnswers.length - 1]?.answer || null);
  };

  // submitQuiz: posts answers to backend, triggers download, and hard-redirects to exact URL
  const submitQuiz = async (finalAnswers) => {
    setSubmitting(true);
    setResult(null);

    try {
      const skillCandidates = [
        "React", "Angular", "Vue", "MongoDB", "MySQL", "Postgres",
        "Node.js", "Django", "Spring", "C++", "Java", "Python", "C",
      ];

      // derive skillsSelected from answers (best-effort)
      const skillsSelected = finalAnswers
        .map((a) => a.answer)
        .filter(Boolean)
        .flatMap((s) =>
          skillCandidates.filter((k) => s.toLowerCase().includes(k.toLowerCase()))
        )
        .filter((v, i, arr) => arr.indexOf(v) === i);

      setLastSkillsSelected(skillsSelected || []);

      const body = JSON.stringify({ answers: finalAnswers, skillsSelected });

      const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

      const token = localStorage.getItem("token") || localStorage.getItem("authToken") || null;
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const resp = await fetch(`${BASE}/api/v1/quiz`, {
        method: "POST",
        headers,
        credentials: "include",
        body,
      });

      const raw = await resp.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (parseErr) {
        console.warn("Could not parse JSON from /api/v1/quiz response:", parseErr, "raw:", raw);
        data = { __raw: raw };
      }

      if (!resp.ok) {
        const serverMsg = data?.message || data?.error || data?.__raw || `Server error: ${resp.status}`;
        console.error("Quiz submission failed:", resp.status, serverMsg, data);
        setResult({ success: false, message: serverMsg });
        setSubmitting(false);
        return;
      }

      // success
      setResult({ success: true, ...data });

      // trigger download if reportUrl provided
      if (data.reportUrl) {
        const url = data.reportUrl.startsWith("http") ? data.reportUrl : `${BASE}${data.reportUrl}`;
        const a = document.createElement("a");
        a.href = url;
        a.download = `quiz-report-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      // Mark localStorage as completed as well (so popup won't show again)
      try {
        if (storageKey) localStorage.setItem(storageKey, "1");
      } catch (e) {
        // ignore
      }

      // HARD redirect to the exact route requested by you:
      // http://localhost:5173/job/getall with skills filter if any.
      // Use server-provided skills if present, else use client-side detected skills.
      setTimeout(() => {
        const skillsToUse = (data.skillsSelected && data.skillsSelected.length) ? data.skillsSelected : (lastSkillsSelected || skillsSelected || []);
        const hostBase = "http://localhost:5173";
        const path = "/job/getall";
        if (skillsToUse && skillsToUse.length > 0) {
          const param = encodeURIComponent(skillsToUse.join(","));
          window.location.href = `${hostBase}${path}?skills=${param}`;
        } else {
          window.location.href = `${hostBase}${path}`;
        }
      }, 3000);

    } catch (err) {
      console.error("Quiz submit error (network/exception):", err);
      setResult({ success: false, message: err?.message || "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <h3>Quick Career Quiz ({current + 1}/{QUESTIONS.length})</h3>
        <p style={{ fontWeight: 600 }}>{q.q}</p>

        <div style={{ marginTop: 12 }}>
          {q.options.map((opt) => (
            <div key={opt} style={{ marginBottom: 8 }}>
              <label style={{ cursor: "pointer" }}>
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={opt}
                  checked={selected === opt}
                  onChange={() => choose(opt)}
                />{" "}
                {opt}
              </label>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between" }}>
          <button onClick={prev} disabled={current === 0 || submitting}>Back</button>

          <div>
            {current + 1 < QUESTIONS.length ? (
              <button onClick={next} disabled={!selected || submitting}>Next</button>
            ) : (
              <button onClick={() => next()} disabled={!selected || submitting}>Submit</button>
            )}
          </div>
        </div>

        {submitting && <p style={{ marginTop: 12 }}>Submitting...</p>}
        {result && (
          <div style={{ marginTop: 12 }}>
            {result.success ? (
              <p>Quiz submitted. Found {result.matchCount ?? 0} matching jobs. Redirecting...</p>
            ) : (
              <p style={{ color: "red" }}>{result.message || "Error"}</p>
            )}
          </div>
        )}

        <button
          onClick={() => setVisible(false)}
          style={{ position: "absolute", top: 8, right: 8, background: "transparent", border: "none" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// minimal inline styles
const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const modalStyle = {
  width: "min(720px, 96%)",
  background: "#fff",
  padding: 20,
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
  position: "relative",
};
