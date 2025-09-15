// backend/controllers/jobController.js
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Job } from "../models/jobSchema.js";
import { Application } from "../models/applicationSchema.js";
import ErrorHandler from "../middlewares/error.js";

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
 * - Filters jobs by skills
 * - Only returns jobs that are within their active startDate/endDate window
 * - Excludes expired jobs
 * - Excludes jobs already applied to by the current job seeker
 */
export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  let skillsParam = req.query.skills;
  let skills = [];

  if (typeof skillsParam === "string" && skillsParam.trim().length > 0) {
    try {
      skillsParam = decodeURIComponent(skillsParam);
    } catch (e) {}
    skills = skillsParam.split(",").map((s) => s.trim()).filter(Boolean);
  }

  if (skills.length === 0 && req.user && Array.isArray(req.user.skills) && req.user.skills.length > 0) {
    skills = req.user.skills.map((s) => String(s || "").trim()).filter(Boolean);
  }

  if (!skills || skills.length === 0) {
    return res.status(200).json({ success: true, jobs: [] });
  }

  const normalizeToken = (s = "") => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const requestedNorm = Array.from(new Set(skills.map((s) => normalizeToken(s)).filter(Boolean)));

  const now = new Date();

  const candidateJobs = await Job.find({
    expired: false,
    startDate: { $lte: now },
    endDate: { $gte: now },
    skills: { $exists: true, $ne: [] },
  }).lean();

  let appliedJobIdSet = new Set();
  let currentUserIdStr = null;
  try {
    if (req.user && req.user._id && req.user.role !== "Employer") {
      currentUserIdStr = String(req.user._id);
      const appliedRecords = await Application.find({ "applicantID.user": req.user._id }).select("job").lean();
      for (const rec of appliedRecords) {
        if (rec && rec.job) appliedJobIdSet.add(String(rec.job));
      }
    }
  } catch (e) {
    console.warn("[getAllJobs] failed to fetch user's applied jobs:", e);
  }

  const matched = [];
  for (const job of candidateJobs) {
    if (!job.skills || !Array.isArray(job.skills) || job.skills.length === 0) continue;

    if (req.user && req.user.role !== "Employer") {
      if (appliedJobIdSet.has(String(job._id))) continue;
      if (Array.isArray(job.applicants) && currentUserIdStr) {
        const applicantsNormalized = job.applicants.map((a) => String(a)).filter(Boolean);
        if (applicantsNormalized.includes(currentUserIdStr)) continue;
      }
    }

    const jobSkillNorms = job.skills.map((s) => normalizeToken(s)).filter(Boolean);
    const anyMatch = requestedNorm.some((rq) => jobSkillNorms.some((js) => js.includes(rq) || rq.includes(js)));
    if (anyMatch) matched.push(job);
  }

  return res.status(200).json({ success: true, jobs: matched });
});

/**
 * POST /api/v1/job/post
 * Employers can post jobs with timings and companyName
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
    skills,
    companyName,
    startDate,
    endDate,
  } = req.body;

  if (!title || !description || !category || !country || !city || !location || !companyName || !startDate || !endDate) {
    return next(new ErrorHandler("Please provide full job details including company and timings.", 400));
  }

  if ((!salaryFrom || !salaryTo) && !fixedSalary) {
    return next(new ErrorHandler("Please either provide fixed salary or ranged salary.", 400));
  }

  if (salaryFrom && salaryTo && fixedSalary) {
    return next(new ErrorHandler("Cannot Enter Fixed and Ranged Salary together.", 400));
  }

  const processedSkills = normalizeSkillsInput(skills);
  if (!processedSkills.length) {
    return next(new ErrorHandler("Please provide at least one skill for this job.", 400));
  }

  const postedBy = req.user._id;

  const job = await Job.create({
    title,
    description,
    companyName,
    category,
    country,
    city,
    location,
    fixedSalary,
    salaryFrom,
    salaryTo,
    startDate,
    endDate,
    postedBy,
    skills: processedSkills,
  });

  res.status(200).json({
    success: true,
    message: "Job Posted Successfully!",
    job,
  });
});

export const getMyJobs = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(new ErrorHandler("Job Seeker not allowed to access this resource.", 400));
  }
  const myJobs = await Job.find({ postedBy: req.user._id });
  res.status(200).json({ success: true, myJobs });
});

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

  if (req.body.skills) {
    req.body.skills = normalizeSkillsInput(req.body.skills);
  }

  job = await Job.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({ success: true, message: "Job Updated!", job });
});

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
  res.status(200).json({ success: true, message: "Job Deleted!" });
});

/**
 * GET /api/v1/job/:id
 * Get single job details and auto-mark expired if endDate passed
 */
export const getSingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  try {
    const job = await Job.findById(id);
    if (!job) {
      return next(new ErrorHandler("Job not found.", 404));
    }

    const now = new Date();
    if (job.endDate && job.endDate < now) {
      job.expired = true;
      await job.save();
    }

    res.status(200).json({ success: true, job });
  } catch (error) {
    return next(new ErrorHandler(`Invalid ID / CastError`, 404));
  }
});

/**
 * POST /api/v1/job/apply/:id
 */
export const applyToJob = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user && req.user._id;
  const jobId = req.params.id;

  if (!userId) {
    return next(new ErrorHandler("User not authenticated", 401));
  }

  const jobExists = await Job.findById(jobId).select("_id endDate expired");
  if (!jobExists) {
    return next(new ErrorHandler("Job not found.", 404));
  }

  const now = new Date();
  if (jobExists.expired || (jobExists.endDate && jobExists.endDate < now)) {
    return next(new ErrorHandler("Job is closed. You cannot apply.", 400));
  }

  const updated = await Job.findOneAndUpdate(
    { _id: jobId, applicants: { $ne: userId } },
    { $push: { applicants: userId } },
    { new: true }
  );

  if (!updated) {
    return res.status(400).json({ success: false, message: "You have already applied to this job." });
  }

  return res.status(200).json({ success: true, message: "Applied successfully.", job: updated });
});
