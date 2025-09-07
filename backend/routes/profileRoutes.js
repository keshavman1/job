// backend/routes/profileRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { isAuthenticated } from "../middlewares/auth.js";
import { uploadResume, uploadProfilePhoto, getMe, updateProfile } from "../controllers/profileController.js";

const router = express.Router();

/**
 * Multer disk storage with unique filenames and correct destination per fieldname.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const base = process.cwd();
    if (file.fieldname === "resume") {
      const d = path.join(base, "backend", "uploads", "resumes");
      fs.mkdirSync(d, { recursive: true });
      cb(null, d);
    } else if (file.fieldname === "photo") {
      const d = path.join(base, "backend", "profile-pic");
      fs.mkdirSync(d, { recursive: true });
      cb(null, d);
    } else {
      const d = path.join(base, "backend", "uploads");
      fs.mkdirSync(d, { recursive: true });
      cb(null, d);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uid = req.user ? String(req.user._id) : "anon";
    const rnd = crypto.randomBytes(6).toString("hex");
    const name = `${uid}-${Date.now()}-${rnd}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    // Basic validation
    if (file.fieldname === "photo") {
      if (!file.mimetype.startsWith("image/")) return cb(new Error("Only images allowed for photo"));
    }
    if (file.fieldname === "resume") {
      const allowed = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowed.includes(file.mimetype)) return cb(new Error("Resume must be PDF or DOC/DOCX"));
    }
    cb(null, true);
  },
});

/* Profile endpoints */
router.get("/me", isAuthenticated, getMe);
router.put("/", isAuthenticated, updateProfile);

/* Upload endpoints expected by frontend */
router.post("/upload/resume", isAuthenticated, upload.single("resume"), uploadResume);
router.post("/upload/photo", isAuthenticated, upload.single("photo"), uploadProfilePhoto);

export default router;
