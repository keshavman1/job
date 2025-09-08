// backend/routes/jobRoutes.js
import express from "express";
import {
  deleteJob,
  getAllJobs,
  getMyJobs,
  getSingleJob,
  postJob,
  updateJob,
} from "../controllers/jobController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { optionalAuth } from "../middlewares/optionalAuth.js"; // make sure this file exists

const router = express.Router();

/**
 * Public endpoint - optionalAuth tries to populate req.user when a valid cookie is present,
 * but does NOT enforce authentication. This allows getAllJobs to use req.user.skills when available
 * while keeping the endpoint public.
 *
 * Query support: ?skills=skill1,skill2
 */
router.get("/getall", optionalAuth, getAllJobs);

// Authenticated endpoints for job management
router.post("/post", isAuthenticated, postJob);
router.get("/getmyjobs", isAuthenticated, getMyJobs);
router.put("/update/:id", isAuthenticated, updateJob);
router.delete("/delete/:id", isAuthenticated, deleteJob);

// Get single job (public)
router.get("/:id", getSingleJob);

export default router;
