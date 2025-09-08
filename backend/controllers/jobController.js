// backend/controllers/jobController.js
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Job } from "../models/jobSchema.js";
import ErrorHandler from "../middlewares/error.js";

/**
 * Utility: escape regex special chars from user-provided skill strings
 */
const escapeRegExp = (string = "") => String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Helper: normalize a skills input (comma-separated string or array) into a clean array of non-empty trimmed strings
 */
const normalizeSkillsInput = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s || "").trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => String(s || "").trim())
      .filter(Boolean);
  }
  return [];
};

/**
 * GET /api/v1/job/getall
 *
 * Query: ?skills=skill1,skill2  (comma separated, URL-encoded allowed)
 *
 * Behavior:
 * - If skills param provided: filter jobs whose `skills` array contains ANY of the provided skills,
 *   matching case-insensitively (uses regex substring matching).
 * - Else if req.user exists AND req.user.skills is a non-empty array: use req.user.skills to filter.
 * - Else: return an empty jobs array (no skills known -> no matches should be displayed).
 *
 */
export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  // 1) Read skills from query param
  let skillsParam = req.query.skills;
  let skills = [];

  if (typeof skillsParam === "string" && skillsParam.trim().length > 0) {
    try {
      skillsParam = decodeURIComponent(skillsParam);
    } catch (e) {
      // ignore decode errors and continue with raw string
    }
    skills = skillsParam.split(",").map((s) => s.trim()).filter(Boolean);
  }

  // 2) If no query skills, try to use authenticated user's skills (if available)
  if (skills.length === 0 && req.user && Array.isArray(req.user.skills) && req.user.skills.length > 0) {
    skills = req.user.skills.map((s) => String(s || "").trim()).filter(Boolean);
  }

  // 3) If still no skills available, return empty list (do NOT return all jobs)
  if (!skills || skills.length === 0) {
    console.log("[getAllJobs] no skills provided (query or user). Returning empty jobs array.");
    return res.status(200).json({ success: true, jobs: [] });
  }

  // Normalize and prepare regexes for substring, case-insensitive matching
  const normalizedSkills = skills.map((s) => String(s).toLowerCase()).filter(Boolean);
  console.log("[getAllJobs] filtering jobs by skills:", normalizedSkills);

  const regexes = normalizedSkills.map((s) => new RegExp(escapeRegExp(s), "i"));

  // Aggregation pipeline: unwind skills and match against regexes, then reconstruct job docs
  const pipeline = [
    { $match: { expired: false, skills: { $exists: true, $ne: [] } } },
    { $unwind: "$skills" },
    { $match: { skills: { $in: regexes } } },
    {
      $group: {
        _id: "$_id",
        doc: { $first: "$$ROOT" },
      },
    },
    { $replaceRoot: { newRoot: "$doc" } },
    { $sort: { createdAt: -1 } },
  ];

  const jobs = await Job.aggregate(pipeline).allowDiskUse(true);

  console.log(`[getAllJobs] matched ${jobs.length} jobs for skills=${normalizedSkills.join(",")}`);

  return res.status(200).json({ success: true, jobs });
});

/**
 * POST /api/v1/job/post
 * - Only employers allowed (existing role check)
 * - Enforce presence of at least one skill (skills can be sent as array or comma-separated string)
 */
export const postJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(new ErrorHandler("Job Seeker not allowed to access this resource.", 400));
  }

  const {
    title,
    description,
    category,
    country,
    city,
    location,
    fixedSalary,
    salaryFrom,
    salaryTo,
    skills // optional in original; we'll validate below
  } = req.body;

  // Basic required fields check
  if (!title || !description || !category || !country || !city || !location) {
    return next(new ErrorHandler("Please provide full job details.", 400));
  }

  // Salary validation
  if ((!salaryFrom || !salaryTo) && !fixedSalary) {
    return next(new ErrorHandler("Please either provide fixed salary or ranged salary.", 400));
  }

  if (salaryFrom && salaryTo && fixedSalary) {
    return next(new ErrorHandler("Cannot Enter Fixed and Ranged Salary together.", 400));
  }

  // Process skills into an array regardless of input shape, and normalize
  const processedSkills = normalizeSkillsInput(skills);

  // Enforce at least one skill
  if (!processedSkills.length) {
    return next(new ErrorHandler("Please provide at least one skill for this job.", 400));
  }

  const postedBy = req.user._id;

  const job = await Job.create({
    title,
    description,
    category,
    country,
    city,
    location,
    fixedSalary,
    salaryFrom,
    salaryTo,
    postedBy,
    skills: processedSkills
  });

  res.status(200).json({
    success: true,
    message: "Job Posted Successfully!",
    job,
  });
});

/**
 * GET /api/v1/job/getmyjobs
 */
export const getMyJobs = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(new ErrorHandler("Job Seeker not allowed to access this resource.", 400));
  }
  const myJobs = await Job.find({ postedBy: req.user._id });
  res.status(200).json({
    success: true,
    myJobs,
  });
});

/**
 * Update job
 */
export const updateJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(new ErrorHandler("Job Seeker not allowed to access this resource.", 400));
  }
  const { id } = req.params;
  let job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }

  // If skills are being updated, normalize them before applying
  if (req.body.skills) {
    req.body.skills = normalizeSkillsInput(req.body.skills);
  }

  job = await Job.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    message: "Job Updated!",
    job,
  });
});

/**
 * Delete job
 */
export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(new ErrorHandler("Job Seeker not allowed to access this resource.", 400));
  }
  const { id } = req.params;
  const job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }
  await job.deleteOne();
  res.status(200).json({
    success: true,
    message: "Job Deleted!",
  });
});

/**
 * GET single job
 */
export const getSingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  try {
    const job = await Job.findById(id);
    if (!job) {
      return next(new ErrorHandler("Job not found.", 404));
    }
    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    return next(new ErrorHandler(`Invalid ID / CastError`, 404));
  }
});
