// backend/controllers/applicationController.js
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { User } from "../models/userSchema.js";
import path from "path";

/**
 * POST /api/v1/application/post
 * Accepts multipart/form-data with optional resume file (field 'resume')
 * If resume file is provided it uses that; otherwise it falls back to user's saved resume (User.resumePath or User.resume)
 */
export const postApplication = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    return next(
      new ErrorHandler("Employer not allowed to access this resource.", 400)
    );
  }

  const { name, email, coverLetter, phone, address, jobId } = req.body;

  if (!jobId) {
    return next(new ErrorHandler("Job not provided!", 404));
  }

  const jobDetails = await Job.findById(jobId);
  if (!jobDetails) {
    return next(new ErrorHandler("Job not found!", 404));
  }

  // Prepare applicant & employer info
  const applicantID = {
    user: req.user._id,
    role: "Job Seeker",
  };

  const employerID = {
    user: jobDetails.postedBy,
    role: "Employer",
  };

  // basic required fields (still require these)
  if (!name || !email || !coverLetter || !phone || !address) {
    return next(new ErrorHandler("Please fill all fields.", 400));
  }

  // Decide resume source:
  // 1) If a resume file was uploaded in this request (req.file) -> use it
  // 2) Else, fall back to user's saved dashboard resume (User.resumePath or User.resume)
  let resumeUrl = null;
  let originalName = null;

  if (req.file) {
    // multer provided file; filename should be available
    const filename = req.file.filename || path.basename(req.file.path || "");
    // public static route in app.js: app.use("/static/uploads", express.static(path.join(process.cwd(), "backend", "uploads")));
    resumeUrl = `/static/uploads/resumes/${filename}`;
    originalName = req.file.originalname || filename;
  } else {
    // No file uploaded with this request -> try to read user's saved resume path
    const user = await User.findById(req.user._id).lean();
    if (user && (user.resumePath || user.resume)) {
      if (user.resumePath) {
        resumeUrl = user.resumePath; // should already be /static/...
      } else if (user.resume) {
        resumeUrl = `/static/uploads/resumes/${user.resume}`;
      }
      originalName = user.resume || null;
    }
  }

  // If still no resumeUrl, return an error (previous behavior required resume)
  if (!resumeUrl) {
    return next(
      new ErrorHandler(
        "Resume required. Please upload resume in Dashboard or attach it here.",
        400
      )
    );
  }

  // Create application record; store resume.url as public static path that frontend can render
  const application = await Application.create({
    name,
    email,
    coverLetter,
    phone,
    address,
    applicantID,
    employerID,
    resume: {
      public_id: null,
      url: resumeUrl,
      originalName: originalName || null,
    },
  });

  res.status(200).json({
    success: true,
    message: "Application Submitted!",
    application,
  });
});

/* ---------- other existing controller exports (preserved) ---------- */

export const employerGetAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Job Seeker") {
      return next(
        new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
      );
    }
    const { _id } = req.user;
    const applications = await Application.find({ "employerID.user": _id });
    res.status(200).json({
      success: true,
      applications,
    });
  }
);

export const jobseekerGetAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Employer") {
      return next(
        new ErrorHandler("Employer not allowed to access this resource.", 400)
      );
    }
    const { _id } = req.user;
    const applications = await Application.find({ "applicantID.user": _id });
    res.status(200).json({
      success: true,
      applications,
    });
  }
);

export const jobseekerDeleteApplication = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Employer") {
      return next(
        new ErrorHandler("Employer not allowed to access this resource.", 400)
      );
    }
    const { id } = req.params;
    const application = await Application.findById(id);
    if (!application) {
      return next(new ErrorHandler("Application not found!", 404));
    }
    await application.deleteOne();
    res.status(200).json({
      success: true,
      message: "Application Deleted!",
    });
  }
);
