// backend/controllers/userController.js
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { sendToken } from "../utils/jwtToken.js";
import path from "path";

/* ------------------- existing auth handlers ------------------- */

export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !phone || !password || !role) {
    return next(new ErrorHandler("Please fill full form !"));
  }
  const isEmail = await User.findOne({ email });
  if (isEmail) {
    return next(new ErrorHandler("Email already registered !"));
  }
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
  });
  sendToken(user, 201, res, "User Registered Sucessfully !");
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return next(new ErrorHandler("Please provide email ,password and role !"));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email Or Password.", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email Or Password !", 400));
  }
  if (user.role !== role) {
    return next(
      new ErrorHandler(`User with provided email and ${role} not found !`, 404)
    );
  }
  sendToken(user, 201, res, "User Logged In Sucessfully !");
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(201)
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged Out Successfully !",
    });
});


export const getUser = catchAsyncErrors((req, res, next) => {
  // your isAuthenticated middleware should attach user on req.user
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

/* ------------------- profile upload & update handlers ------------------- */

/**
 * POST /api/v1/user/upload/resume
 * multipart form-data -> field name "resume"
 * Saves file and updates user.resume (filename), resumePath (legacy),
 * and returns updated user object (without password).
 */
export const uploadResumeHandler = catchAsyncErrors(async (req, res, next) => {
  // multer will have placed file on req.file
  if (!req.file) return next(new ErrorHandler("No file uploaded", 400));

  // Static URL served by app.js: '/static/uploads' -> backend/uploads
  // our upload middleware stores resume in backend/uploads/resumes/<filename>
  const filename = req.file.filename;
  const url = `/static/uploads/resumes/${filename}`;

  const userId = req.user?._id || req.user;
  if (!userId) return next(new ErrorHandler("Unauthorized", 401));

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        resume: filename,
        resumePath: url,
      },
    },
    { new: true, select: "-password" }
  );

  res.status(200).json({
    success: true,
    message: "Resume uploaded",
    user,
    resumePath: url,
  });
});

/**
 * POST /api/v1/user/upload/profile
 * multipart form-data -> field name "profilePic"
 * Saves file and updates user.profilePic and profilePhotoPath
 */
export const uploadProfileHandler = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) return next(new ErrorHandler("No file uploaded", 400));

  // Static URL served by app.js: '/static/profile-pic' -> backend/profile-pic
  const filename = req.file.filename;
  const url = `/static/profile-pic/${filename}`;

  const userId = req.user?._id || req.user;
  if (!userId) return next(new ErrorHandler("Unauthorized", 401));

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        profilePic: filename,
        profilePhotoPath: url,
      },
    },
    { new: true, select: "-password" }
  );

  res.status(200).json({
    success: true,
    message: "Profile picture uploaded",
    user,
    profilePhotoPath: url,
  });
});

/**
 * PUT /api/v1/user/update
 * Body: { about, name }
 * Updates user about/name.
 */
export const updateProfileHandler = catchAsyncErrors(async (req, res, next) => {
  const { about, name } = req.body;
  const userId = req.user?._id || req.user;
  if (!userId) return next(new ErrorHandler("Unauthorized", 401));

  const updates = {};
  if (typeof about !== "undefined") updates.about = about;
  if (typeof name !== "undefined") updates.name = name;

  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, select: "-password" });

  res.status(200).json({
    success: true,
    message: "Profile updated",
    user,
  });
});
