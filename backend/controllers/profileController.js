// backend/controllers/profileController.js
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import path from "path";
import fs from "fs";

export const getMe = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, user });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const updates = {};
  const allowed = ["name", "skills", "about", "companyDescription", "hiringRoles"];
  for (const k of allowed) {
    if (k in req.body) updates[k] = req.body[k];
  }
  // Prevent email/phone edits
  if ("email" in req.body || "phone" in req.body) {
    return next(new ErrorHandler("Email/Phone cannot be edited.", 400));
  }
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.status(200).json({ success: true, user });
});

/**
 * Helpers to derive web-friendly paths
 */
const webPathForResume = (filename) => `/static/uploads/resumes/${filename}`;
const webPathForPhoto = (filename) => `/static/profile-pic/${filename}`;

/**
 * uploadResume - expects a multer-saved file in req.file
 * Stores both server fs path and a web path on the user document and returns both.
 */
export const uploadResume = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) return next(new ErrorHandler("Resume file required.", 400));

  // req.file.path is the absolute/server path where multer stored the file
  const serverPath = req.file.path;
  const filename = req.file.filename || path.basename(serverPath);

  // Optionally, ensure uploads/resumes exists (multer route should have created it)
  const resumeWebPath = webPathForResume(filename);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { resumePath: serverPath, resumeWebPath },
    { new: true }
  ).select("-password");

  res.status(200).json({
    success: true,
    message: "Resume uploaded.",
    path: serverPath,
    resumeWebPath,
    user,
  });
});

/**
 * uploadProfilePhoto - expects multer-saved req.file
 * Stores server path and web path on user and returns them.
 */
export const uploadProfilePhoto = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) return next(new ErrorHandler("Profile photo required.", 400));

  const serverPath = req.file.path;
  const filename = req.file.filename || path.basename(serverPath);
  const profilePhotoPath = webPathForPhoto(filename);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profilePhotoPath: profilePhotoPath, profilePic: serverPath },
    { new: true }
  ).select("-password");

  res.status(200).json({
    success: true,
    message: "Profile photo uploaded.",
    path: serverPath,
    profilePhotoPath,
    user,
  });
});
