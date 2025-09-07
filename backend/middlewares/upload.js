// backend/middlewares/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const resumesDir = path.join(__dirname, "..", "uploads", "resumes");
const profileDir = path.join(__dirname, "..", "uploads", "profilePics");

ensureDir(resumesDir);
ensureDir(profileDir);

const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, resumesDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${name}${ext}`);
  },
});

const profileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, profileDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${name}${ext}`);
  },
});

export const uploadResume = multer({ storage: resumeStorage });
export const uploadProfile = multer({ storage: profileStorage });

// generic single middleware: upload.single('resume') or upload.single('profilePic') can also be used
export const upload = multer({ storage: resumeStorage });
