// backend/controllers/quizController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { QuizResult } from "../models/quizSchema.js";
import { Job } from "../models/jobSchema.js";
import User from "../models/userSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ensure reports folder exists and return it
const ensureReportsFolder = () => {
  const reportsDir = path.join(__dirname, "..", "uploads", "reports");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  return reportsDir;
};

// CSV generator
const generateCSVReport = async ({ user, quiz, matchedJobs }) => {
  const reportsDir = ensureReportsFolder();
  const timestamp = Date.now();
  const fileName = `quiz-report-${user._id}-${timestamp}.csv`;
  const filePath = path.join(reportsDir, fileName);

  const lines = [];
  lines.push(`User Name,${user.name || ""}`);
  lines.push(`User Email,${user.email || ""}`);
  lines.push(`Date,${new Date().toISOString()}`);
  lines.push("");
  lines.push("Question Id,Answer");
  for (const a of (quiz.answers || [])) {
    const qid = a.qId || "";
    const ans = (a.answer || "").toString().replace(/,/g, " / ");
    lines.push(`${qid},${ans}`);
  }
  lines.push("");
  lines.push(`Skills Selected,${(quiz.skillsSelected || []).join("; ")}`);
  lines.push(`Matched Job Count,${matchedJobs.length}`);
  lines.push("");
  lines.push("Matched Jobs (id,title,company,requiredSkills)");
  for (const j of matchedJobs) {
    const skills = (j.skills || []).join("|");
    const title = (j.title || "").replace(/,/g, " - ");
    const comp = (j.companyName || j.company || "").replace(/,/g, " - ");
    lines.push(`${j._id},${title},${comp},${skills}`);
  }

  const content = lines.join("\n");
  await fs.promises.writeFile(filePath, content, "utf8");

  // public path — frontend should prefix with backend origin if needed
  const reportUrlPath = `/static/uploads/reports/${fileName}`;

  console.log("Quiz report written:", filePath);
  console.log("Quiz report public path:", reportUrlPath);

  return { filePath, reportUrlPath };
};

// normalization helpers (kept from your version)
const normalizeAnswers = (raw) => {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    const mapped = raw.map((item) => {
      if (item == null) return null;
      if (typeof item === "object") {
        return { qId: String(item.qId || "").trim(), answer: String(item.answer || "").trim() };
      }
      if (typeof item === "string") {
        try {
          const parsed = JSON.parse(item);
          if (parsed && typeof parsed === "object") {
            return { qId: String(parsed.qId || "").trim(), answer: String(parsed.answer || "").trim() };
          }
        } catch (e) {
          return { qId: "", answer: item.trim() };
        }
      }
      return { qId: "", answer: String(item).trim() };
    });
    return mapped.filter(Boolean);
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return normalizeAnswers(parsed);
    } catch (e) {
      try {
        const alt = raw.replace(/'/g, '"');
        const parsed = JSON.parse(alt);
        return normalizeAnswers(parsed);
      } catch (e2) {
        return [{ qId: "", answer: raw.trim() }];
      }
    }
  }

  return [];
};

const normalizeSkills = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
    } catch {}
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const normalizeForMatch = (s = "") =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9+]/g, "");

/**
 * Controller: takeQuiz
 */
export const takeQuiz = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const rawAnswers = req.body.answers;
    const rawSkills = req.body.skillsSelected;

    const answers = normalizeAnswers(rawAnswers);
    const skillsSelected = normalizeSkills(rawSkills);

    // dedupe answers
    const seenQ = new Set();
    const dedupedAnswers = [];
    for (const item of answers) {
      const id = (item.qId || "").toString();
      if (id) {
        if (!seenQ.has(id)) {
          seenQ.add(id);
          dedupedAnswers.push({ qId: id, answer: item.answer || "" });
        }
      } else {
        const key = `__ans__:${item.answer || ""}`;
        if (!seenQ.has(key)) {
          seenQ.add(key);
          dedupedAnswers.push({ qId: "", answer: item.answer || "" });
        }
      }
    }

    // create quiz result record
    const qr = await QuizResult.create({
      user: req.user._id,
      answers: dedupedAnswers,
      skillsSelected,
    });

    // prepare normalized set used for matching
    const normalizedUserSkills = (skillsSelected || []).map((s) => normalizeForMatch(s)).filter(Boolean);

    if (!normalizedUserSkills.length) {
      const detected = dedupedAnswers.map((a) => a.answer).filter(Boolean);
      detected.forEach((d) => {
        const n = normalizeForMatch(d);
        if (n) normalizedUserSkills.push(n);
      });
    }

    // ---- STRICT active-job query using your schema's fields ----
    const now = new Date();

    // We require:
    //  - expired === false
    //  - startDate <= now
    //  - endDate >= now
    // This matches how the frontend shows active jobs.
    const jobsRaw = await Job.find({
      expired: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).lean();

    // Filter matched jobs by skills
    const matchedJobs = jobsRaw.filter((job) => {
      const jobSkills = Array.isArray(job.skills) ? job.skills : [];
      const normJobSkills = jobSkills.map((s) => normalizeForMatch(s)).filter(Boolean);
      return normJobSkills.some((js) => normalizedUserSkills.includes(js));
    });

    // persist summary & user flags
    qr.matchCount = matchedJobs.length;
    qr.matchedJobIds = matchedJobs.map((j) => j._id);
    qr.details = { matchedAt: new Date().toISOString() };
    await qr.save();

    await User.findByIdAndUpdate(
      req.user._id,
      {
        quizCompleted: true,
        skills: skillsSelected,
        quizAnswers: dedupedAnswers,
        quizSummary: { matchCount: matchedJobs.length, matchedJobIds: matchedJobs.map((j) => j._id), skillsSelected },
      },
      { new: true }
    );

    // write CSV
    const { filePath, reportUrlPath } = await generateCSVReport({ user: req.user, quiz: qr, matchedJobs });

    console.log("Quiz matched jobs count:", matchedJobs.length);
    console.log("Matched job IDs:", matchedJobs.map((j) => j._id));

    return res.status(200).json({
      success: true,
      message: "Quiz submitted.",
      matchCount: matchedJobs.length,
      jobs: matchedJobs,
      reportUrl: reportUrlPath,
      skillsSelected,
    });
  } catch (err) {
    console.error("takeQuiz error:", err && err.stack ? err.stack : err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Server error while processing quiz.",
    });
  }
});

/**
 * Controller: quizReport
 */
export const quizReport = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });

    const qr = await QuizResult.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (!qr) return res.status(200).json({ success: true, message: "No quiz taken yet.", report: null });

    const now = new Date();
    const normSkills = (qr.skillsSelected || []).map((s) => normalizeForMatch(s));

    const jobsRaw = await Job.find({
      expired: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).lean();

    const matchedJobs = jobsRaw.filter((job) => {
      const jobSkills = Array.isArray(job.skills) ? job.skills : [];
      const normJobSkills = jobSkills.map((s) => normalizeForMatch(s)).filter(Boolean);
      return normJobSkills.some((js) => normSkills.includes(js));
    });

    return res.status(200).json({
      success: true,
      report: { matchCount: matchedJobs.length, skills: qr.skillsSelected, matchedJobIds: matchedJobs.map((j) => j._id) },
      jobs: matchedJobs,
    });
  } catch (err) {
    console.error("quizReport error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
});
