// frontend/src/components/Auth/QuizPopup.jsx
import React, { useEffect, useState, useContext } from "react";
import { Context } from "/src/context.jsx";

/* QUESTIONS kept same as before */
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

  // compute storage key from user id if available
  const uid = String(user?._id || user?.id || "");
  const storageKey = uid ? `quiz_shown_${uid}` : null;

  // expose debug helpers on window for quick manual tests
  useEffect(() => {
    console.debug("[QuizPopup] mounted. ctx:", { isAuthorized, user, storageKey });
    window.quizShow = () => {
      console.info("[QuizPopup] window.quizShow() called");
      setVisible(true);
    };
    window.quizHide = () => setVisible(false);
    window.quizClearLocal = () => {
      if (!storageKey) return console.warn("[QuizPopup] no storageKey to clear");
      try {
        localStorage.removeItem(storageKey);
        console.info("[QuizPopup] cleared localStorage key:", storageKey);
      } catch (e) {
        console.warn("[QuizPopup] error clearing localStorage", e);
      }
    };
    window.quizStatus = () => ({
      visible,
      current,
      answers,
      selected,
      submitting,
      result,
      user,
      isAuthorized,
      storageKey,
      shownLocal: storageKey ? localStorage.getItem(storageKey) : null,
    });

    // keep last known context too
    window.__QUIZ_LAST_CONTEXT = { isAuthorized, user };

    return () => {
      // cleanup helpers
      try {
        delete window.quizShow;
        delete window.quizHide;
        delete window.quizClearLocal;
        delete window.quizStatus;
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once (helpers don't need to rebind each render)

  // normalized role detection: more tolerant (handles different case / wording)
  const isJobSeekerRole = (() => {
    const r = String(user?.role || "").toLowerCase();
    return r.includes("seeker") || r.includes("job") || r.includes("candidate") || r.includes("applicant") || r === "";
    // NOTE: last `|| r === ""` is an optional fallback for dev - uncomment if you want to show quiz even when role isn't set
  })();

  useEffect(() => {
    // detailed debug before deciding to show
    try {
      const shown = storageKey ? localStorage.getItem(storageKey) === "1" : false;
      console.debug("[QuizPopup] deciding to show", {
        isAuthorized,
        userRole: user?.role,
        userQuizCompleted: user?.quizCompleted,
        storageKey,
        shown,
        isJobSeekerRole,
      });

      // If URL contains ?forceQuiz=1 always show (dev helper)
      const force = typeof window !== "undefined" && window.location && window.location.search.includes("forceQuiz=1");

      if (force) {
        console.info("[QuizPopup] force flag present in URL -> showing quiz");
        setVisible(true);
        return;
      }

      if (isAuthorized && user && isJobSeekerRole && !user.quizCompleted && !shown) {
        const t = setTimeout(() => {
          console.info("[QuizPopup] showing quiz (timeout)");
          setVisible(true);
          // mark shown (try/catch to avoid errors if localStorage blocked)
          try {
            if (storageKey) localStorage.setItem(storageKey, "1");
          } catch (e) {
            console.warn("[QuizPopup] could not write to localStorage", e);
          }
        }, 1200);
        return () => clearTimeout(t);
      } else {
        console.info("[QuizPopup] not showing quiz - conditions not met", {
          isAuthorized,
          user,
          storageKey,
          shown,
          isJobSeekerRole,
        });
      }
    } catch (err) {
      console.error("[QuizPopup] error while deciding to show:", err);
      // fallback: show for dev if something unexpectedly threw
      // setVisible(true);
    }
  }, [isAuthorized, user, storageKey]); // re-run when user/auth changes

  // --- UI logic (choose / next / prev / submit) kept largely the same, with extra logs --- //

  if (!visible) return null;

  const q = QUESTIONS[current];

  const choose = (opt) => {
    setSelected(opt);
  };

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

  const submitQuiz = async (finalAnswers) => {
    setSubmitting(true);
    setResult(null);
    console.info("[QuizPopup] submitting quiz", finalAnswers);

    try {
      const skillCandidates = [
        "React", "Angular", "Vue", "MongoDB", "MySQL", "Postgres",
        "Node.js", "Django", "Spring", "C++", "Java", "Python", "C",
      ];

      const skillsSelected = finalAnswers
        .map((a) => a.answer)
        .filter(Boolean)
        .flatMap((s) =>
          skillCandidates.filter(
            (k) => s.trim().toLowerCase().replace(/[\.\-\s]/g, "") === k.trim().toLowerCase().replace(/[\.\-\s]/g, "")
          )
        )
        .filter((v, i, arr) => arr.indexOf(v) === i);

      setLastSkillsSelected(skillsSelected || []);

      const body = JSON.stringify({ answers: finalAnswers, skillsSelected });

      const BASE = import.meta.env.VITE_API_URL || (window && window.location && `${window.location.protocol}//${window.location.hostname}:4000`) || "http://localhost:4000";

      const token = localStorage.getItem("token") || localStorage.getItem("authToken") || null;
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      console.debug("[QuizPopup] POST", `${BASE}/api/v1/quiz`, { headers, bodyPreview: body.substring(0, 200) });

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
        console.warn("[QuizPopup] parse JSON failed:", parseErr, "raw:", raw);
        data = { __raw: raw };
      }

      console.debug("[QuizPopup] server response", resp.status, data);

      if (!resp.ok) {
        const serverMsg = data?.message || data?.error || data?.__raw || `Server error: ${resp.status}`;
        console.error("[QuizPopup] submission failed:", serverMsg);
        setResult({ success: false, message: serverMsg });
        setSubmitting(false);
        return;
      }

      setResult({ success: true, ...data });

      // download if server returned reportUrl
      if (data.reportUrl) {
        try {
          const url = data.reportUrl.startsWith("http") ? data.reportUrl : `${BASE}${data.reportUrl}`;
          const a = document.createElement("a");
          a.href = url;
          a.download = `quiz-report-${Date.now()}.csv`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          console.info("[QuizPopup] initiated download for", url);
        } catch (e) {
          console.warn("[QuizPopup] error during download step", e);
        }
      }

      try {
        if (storageKey) localStorage.setItem(storageKey, "1");
      } catch (e) {
        console.warn("[QuizPopup] couldn't mark localStorage shown after submit", e);
      }

      // redirect after a short delay
      setTimeout(() => {
        const skillsToUse = (data.skillsSelected && data.skillsSelected.length) ? data.skillsSelected : (lastSkillsSelected || skillsSelected || []);
        const hostBase = window.location.origin.replace(/:\d+$/, ":5173"); // attempt to route to dev front-end port
        const path = "/job/getall";
        if (skillsToUse && skillsToUse.length > 0) {
          const param = encodeURIComponent(skillsToUse.join(","));
          window.location.href = `${hostBase}${path}?skills=${param}`;
        } else {
          window.location.href = `${hostBase}${path}`;
        }
      }, 1200);
    } catch (err) {
      console.error("[QuizPopup] submit catch", err);
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
              <p>Quiz submitted. Found matching jobs. Redirecting...</p>
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

      {/* small debug footer inside modal so devs can quickly see key flags */}
      <div style={{ position: "absolute", bottom: 12, left: 12, fontSize: 11, color: "#666" }}>
        <div>Debug: userId={uid || "no-id"} role={String(user?.role || "undefined")}</div>
        <div>ShownLocal={storageKey ? localStorage.getItem(storageKey) : "no-key"}</div>
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
