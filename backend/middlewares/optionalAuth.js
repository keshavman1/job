// backend/middlewares/optionalAuth.js
import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js"; // corrected path

/**
 * optionalAuth: tries to set req.user if a valid JWT cookie exists.
 * - If no cookie or invalid token: silently continue (do NOT send 401).
 * - If valid: attach full user (without password) to req.user.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) return next();

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return next();

    req.user = user;
    return next();
  } catch (err) {
    // ignore errors and continue as unauthenticated
    return next();
  }
};
