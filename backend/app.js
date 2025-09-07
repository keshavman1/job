// backend/app.js
import express from "express";
import dbConnection from "./database/dbConnection.js";
import jobRouter from "./routes/jobRoutes.js";
import userRouter from "./routes/userRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";
import { config } from "dotenv";
import cors from "cors";
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import profileRouter from "./routes/profileRoutes.js";
import peopleRouter from "./routes/peopleRoutes.js";
import connectionRouter from "./routes/connectionRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import quizRouter from "./routes/quizRoutes.js";
import path from "path";

config({ path: "./config/config.env" });

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads statically
app.use("/static/uploads", express.static(path.join(process.cwd(), "backend", "uploads")));
app.use("/static/profile-pic", express.static(path.join(process.cwd(), "backend", "profile-pic")));

// Routers
app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicationRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/people", peopleRouter);
app.use("/api/v1/connections", connectionRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/quiz", quizRouter);

// connect to DB
dbConnection();

// Error handler (last middleware)
app.use(errorMiddleware);

export default app;
