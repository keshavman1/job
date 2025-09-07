import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { QuizResult } from "../models/quizSchema.js";
import { Job } from "../models/jobSchema.js";

export const takeQuiz = catchAsyncErrors(async (req, res, next) => {
  const { answers = [], skillsSelected = [] } = req.body;
  // Save skills on profile for convenience
  const qr = await QuizResult.create({ user: req.user._id, answers, skillsSelected });
  // Calculate matches: jobs where any skill in skillsSelected is present
  const jobs = await Job.find({ expired: false, skills: { $in: skillsSelected } });
  qr.matchCount = jobs.length;
  await qr.save();
  res.status(200).json({ success: true, message: "Quiz submitted.", matchCount: qr.matchCount, jobs });
});

export const quizReport = catchAsyncErrors(async (req, res, next) => {
  const qr = await QuizResult.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  if (!qr) return res.status(200).json({ success: true, message: "No quiz taken yet.", report: null });
  const jobs = await Job.find({ expired: false, skills: { $in: qr.skillsSelected } });
  res.status(200).json({ success: true, report: { matchCount: jobs.length, skills: qr.skillsSelected }, jobs });
});