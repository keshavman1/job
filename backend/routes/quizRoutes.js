// backend/routes/quizRoutes.js
import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { takeQuiz, quizReport } from "../controllers/quizController.js";

const router = express.Router();

// these require authentication
router.post("/", isAuthenticated, takeQuiz);
router.get("/report", isAuthenticated, quizReport);

export default router;
