// backend/routes/userRoutes.js
import express from "express";
import {
  login,
  register,
  logout,
  getUser,
  uploadResumeHandler,
  uploadProfileHandler,
  updateProfileHandler,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { uploadResume, uploadProfile } from "../middlewares/upload.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);
router.get("/getuser", isAuthenticated, getUser);

// New endpoints:
router.post("/upload/resume", isAuthenticated, uploadResume.single("resume"), uploadResumeHandler);
router.post("/upload/profile", isAuthenticated, uploadProfile.single("profilePic"), uploadProfileHandler);
router.put("/update", isAuthenticated, updateProfileHandler);

export default router;
