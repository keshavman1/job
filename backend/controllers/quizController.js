// backend/controllers/quizController.js
import fs from "fs";
import path from "path";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { QuizResult } from "../models/quizSchema.js";
import { Job } from "../models/jobSchema.js";
import User from "../models/userSchema.js";

/**
 * Helper to ensure reports folder exists
 */
const ensureReportsFolder = () => {
  const reportsDir = path.join(process.cwd(), "backend", "uploads", "reports");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  return reportsDir;
};

/**
 * Generate a simple CSV report and return public URL path (served by app.js static mapping)
 */
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

  // `/static/uploads` is served by app.js -> backend/uploads
  const reportUrlPath = `/static/uploads/reports/${fileName}`;
  return { filePath, reportUrlPath };
};

/**
 * Normalize incoming answers into an array of objects: [{ qId: string, answer: string }]
 * Accepts:
 *  - Array of objects
 *  - Array of strings (JSON or string answers)
 *  - JSON stringified array
 *  - Single string
 */
const normalizeAnswers = (raw) => {
  if (!raw) return [];

  // If already an array
  if (Array.isArray(raw)) {
    const mapped = raw.map((item) => {
      if (item == null) return null;

      if (typeof item === "object") {
        return { qId: String(item.qId || "").trim(), answer: String(item.answer || "").trim() };
      }

      // if item is string, try to JSON.parse
      if (typeof item === "string") {
        try {
          const parsed = JSON.parse(item);
          if (parsed && typeof parsed === "object") {
            return { qId: String(parsed.qId || "").trim(), answer: String(parsed.answer || "").trim() };
          }
        } catch (e) {
          // fallback: treat as answer text only
          return { qId: "", answer: item.trim() };
        }
      }

      // fallback to string coercion
      return { qId: "", answer: String(item).trim() };
    });

    return mapped.filter(Boolean);
  }

  // If raw is a string: try parse as JSON array first
  if (typeof raw === "string") {
    // Try strict JSON parse
    try {
      const parsed = JSON.parse(raw);
      return normalizeAnswers(parsed);
    } catch (e) {
      // Try to replace single quotes with double quotes (best-effort)
      try {
        const alt = raw.replace(/'/g, '"');
        const parsed = JSON.parse(alt);
        return normalizeAnswers(parsed);
      } catch (e2) {
        // fallback: single answer string
        return [{ qId: "", answer: raw.trim() }];
      }
    }
  }

  // Unknown type -> empty
  return [];
};

/**
 * Normalize skillsSelected to array of strings
 */
const normalizeSkills = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
    } catch {}
    // fallback: comma-separated string
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Controller: takeQuiz
 * - normalizes incoming payload
 * - creates QuizResult audit
 * - matches jobs via skills (simple $in)
 * - updates user.quizCompleted & quizSummary and persists user.skills
 * - generates CSV report and returns report URL
 */
export const takeQuiz = catchAsyncErrors(async (req, res, next) => {
  try {
    // Basic auth guard
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // raw incoming payload (may be stringified)
    const rawAnswers = req.body.answers;
    const rawSkills = req.body.skillsSelected;

    // Normalize
    const answers = normalizeAnswers(rawAnswers);
    const skillsSelected = normalizeSkills(rawSkills);

    // Deduplicate answers by qId (keep first occurrence)
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
        // no qId - dedupe by answer text
        const key = `__ans__:${item.answer || ""}`;
        if (!seenQ.has(key)) {
          seenQ.add(key);
          dedupedAnswers.push({ qId: "", answer: item.answer || "" });
        }
      }
    }

    // Create QuizResult (audit)
    const qr = await QuizResult.create({
      user: req.user._id,
      answers: dedupedAnswers,
      skillsSelected,
    });

    // Match jobs: simple rule - jobs not expired and any skill in skillsSelected
    // Use case-insensitive matching by normalizing with regex as needed (Job.find with $in expects exact values),
    // so we will match using regex OR by exact if normalized; here we use $in which works if we normalized skills stored in jobs.
    const jobs = await Job.find({ expired: false, skills: { $in: skillsSelected } }).lean();

    // Save summary information
    qr.matchCount = jobs.length;
    qr.matchedJobIds = jobs.map((j) => j._id);
    qr.details = { matchedAt: new Date().toISOString() };
    await qr.save();

    // Update user - persist selected skills into user.skills so getAllJobs can use req.user.skills
    await User.findByIdAndUpdate(
      req.user._id,
      {
        quizCompleted: true,
        skills: skillsSelected, // persist skills for later filtering
        quizAnswers: dedupedAnswers,
        quizSummary: { matchCount: jobs.length, matchedJobIds: jobs.map((j) => j._id), skillsSelected },
      },
      { new: true }
    );

    // Generate CSV report
    const { reportUrlPath } = await generateCSVReport({ user: req.user, quiz: qr, matchedJobs: jobs });

    return res.status(200).json({
      success: true,
      message: "Quiz submitted.",
      matchCount: jobs.length,
      jobs,
      reportUrl: reportUrlPath,
    });
  } catch (err) {
    // Log server error but return structured JSON
    console.error("takeQuiz error:", err && err.stack ? err.stack : err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Server error while processing quiz.",
    });
  }
});

/**
 * Controller: quizReport (fetch latest quiz and matched jobs)
 */
export const quizReport = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });

    const qr = await QuizResult.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (!qr) return res.status(200).json({ success: true, message: "No quiz taken yet.", report: null });

    const jobs = await Job.find({ expired: false, skills: { $in: qr.skillsSelected } }).lean();

    return res.status(200).json({
      success: true,
      report: { matchCount: jobs.length, skills: qr.skillsSelected, matchedJobIds: jobs.map((j) => j._id) },
      jobs,
    });
  } catch (err) {
    console.error("quizReport error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
});
