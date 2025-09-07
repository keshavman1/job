import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";

export const listPeople = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({}, "name role skills profilePhotoPath createdAt");
  res.status(200).json({ success: true, users });
});