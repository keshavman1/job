// backend/routes/applicationRoutes.js
import express from "express";
import {
  employerGetAllApplications,
  jobseekerDeleteApplication,
  jobseekerGetAllApplications,
  postApplication,
} from "../controllers/applicationController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { uploadResume } from "../middlewares/upload.js";

const router = express.Router();

// expect resume via multer field "resume"
router.post("/post", isAuthenticated, uploadResume.single("resume"), postApplication);
router.get("/employer/getall", isAuthenticated, employerGetAllApplications);
router.get("/jobseeker/getall", isAuthenticated, jobseekerGetAllApplications);
router.delete("/delete/:id", isAuthenticated, jobseekerDeleteApplication);

export default router;
