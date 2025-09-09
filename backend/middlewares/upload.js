// backend/middlewares/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ✅ Save resumes under backend/uploads/resumes (served as /static/uploads/resumes)
const resumesDir = path.join(__dirname, "..", "uploads", "resumes");
// ✅ Save profile pictures under backend/profile-pic (served as /static/profile-pic)
const profileDir = path.join(__dirname, "..", "profile-pic");

ensureDir(resumesDir);
ensureDir(profileDir);

// ----- Resume storage -----
const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, resumesDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${name}${ext}`);
  },
});

// ----- Profile storage -----
const profileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, profileDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${name}${ext}`);
  },
});

// ----- File filters -----
const resumeFilter = (_req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  cb(null, allowed.includes(ext));
};

const imageFilter = (_req, file, cb) => {
  const allowed = [".png", ".jpg", ".jpeg", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  cb(null, allowed.includes(ext));
};

// ----- Export middlewares -----
export const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadProfile = multer({
  storage: profileStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
});

// generic single middleware (legacy fallback)
export const upload = multer({ storage: resumeStorage });
