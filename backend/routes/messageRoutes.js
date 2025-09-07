// backend/routes/messageRoutes.js
import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { listMessages, sendMessage } from "../controllers/messageController.js";

const router = express.Router();

// list conversation messages with other user
router.get("/:otherId", isAuthenticated, listMessages);

// send a message to other user
router.post("/:otherId", isAuthenticated, sendMessage);

export default router;
