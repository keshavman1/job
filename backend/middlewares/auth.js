// backend/middlewares/auth.js
import { User } from "../models/userSchema.js";
import jwt from "jsonwebtoken";

/**
 * isAuthenticated middleware - checks for JWT in cookie or Authorization header.
 * On failure, returns a JSON 401 response so client can handle it cleanly.
 */
export const isAuthenticated = async (req, res, next) => {
  try {
    let token = null;

    // 1) Try cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // 2) Fallback Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "User Not Authorized: token missing" });
    }

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User Not Authorized: user not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Role guard (unchanged behavior)
export const isAuthorized = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "User Not Authenticated" });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Role (${req.user.role}) not allowed` });
  }
  next();
};
