// backend/routes/peopleRoutes.js
import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { listPeople } from "../controllers/peopleController.js";

const router = express.Router();

router.get("/", isAuthenticated, listPeople);

export default router;
