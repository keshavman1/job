// backend/routes/connectionRoutes.js
import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  sendRequest,
  listRequests,
  respondRequest,
  getStatus,
  myConnections,
} from "../controllers/connectionController.js";

const router = express.Router();

// send a new request to user :id
router.post("/request/:id", isAuthenticated, sendRequest);

// list incoming pending requests
router.get("/requests", isAuthenticated, listRequests);

// respond to request (accept/decline) by connection id
router.put("/respond/:id", isAuthenticated, respondRequest);

// check connection status with another user
router.get("/status/:otherId", isAuthenticated, getStatus);

// my accepted connections
router.get("/me", isAuthenticated, myConnections);

export default router;
