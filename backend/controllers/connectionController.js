// backend/controllers/connectionController.js
import mongoose from "mongoose";
import { Connection } from "../models/connectionSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";

/**
 * Utility to validate ObjectId strings
 */
const isValidObjectId = (id) => {
  return mongoose.isValidObjectId(id);
};

/**
 * Send a connection request from authenticated user -> :id (recipient)
 */
export const sendRequest = catchAsyncErrors(async (req, res, next) => {
  const recipientId = req.params.id;
  const requester = req.user;

  // validate IDs
  if (!requester || !requester._id) {
    return next(new ErrorHandler("Not authenticated", 401));
  }
  if (!isValidObjectId(recipientId)) {
    return next(new ErrorHandler("Invalid recipient id", 400));
  }

  const requesterId = String(requester._id);

  if (requesterId === String(recipientId)) {
    return res.status(400).json({ success: false, message: "Cannot send request to yourself" });
  }

  const recipientUser = await User.findById(recipientId);
  if (!recipientUser) {
    return res.status(404).json({ success: false, message: "Recipient user not found" });
  }

  // Find any existing connection in either direction
  let existing = await Connection.findOne({
    $or: [
      { requester: requesterId, recipient: recipientId },
      { requester: recipientId, recipient: requesterId },
    ],
  });

  if (existing) {
    // If previously declined, allow re-sending by creating a new pending or updating status
    if (existing.status === "declined" && String(existing.requester) !== requesterId) {
      existing.requester = requesterId;
      existing.recipient = recipientId;
      existing.status = "pending";
      await existing.save();
      const io = req.app.get("io");
      if (io) io.to(String(recipientId)).emit("connection-request", { from: requesterId, connection: existing });
      return res.status(200).json({ success: true, connection: existing, message: "Request re-sent" });
    }

    return res.status(200).json({
      success: true,
      connection: existing,
      message: "Connection already exists",
    });
  }

  // create new pending connection
  const connection = await Connection.create({
    requester: requesterId,
    recipient: recipientId,
    status: "pending",
  });

  // notify recipient via socket room named by userId
  const io = req.app.get("io");
  if (io) {
    io.to(String(recipientId)).emit("connection-request", {
      from: requesterId,
      connection: {
        _id: connection._id,
        requester: requesterId,
        recipient: recipientId,
        status: connection.status,
      },
    });
  }

  return res.status(201).json({ success: true, connection, message: "Request sent" });
});

/**
 * List incoming pending requests for the authenticated user
 */
export const listRequests = catchAsyncErrors(async (req, res) => {
  const userId = req.user && req.user._id;
  if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

  const requests = await Connection.find({ recipient: userId, status: "pending" })
    .populate("requester", "name email role skills profilePic")
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, requests });
});

/**
 * Respond (accept/decline) to a connection request by connection id
 * Body: { action: "accept" | "decline" }
 */
export const respondRequest = catchAsyncErrors(async (req, res) => {
  const connectionId = req.params.id;
  const { action } = req.body;

  if (!isValidObjectId(connectionId)) {
    return res.status(400).json({ success: false, message: "Invalid connection id" });
  }

  const connection = await Connection.findById(connectionId);
  if (!connection) return res.status(404).json({ success: false, message: "Request not found" });

  if (String(connection.recipient) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: "Not authorized to respond to this request" });
  }

  if (!["accept", "decline"].includes(action)) {
    return res.status(400).json({ success: false, message: "Invalid action" });
  }

  connection.status = action === "accept" ? "accepted" : "declined";
  await connection.save();

  // Optionally update users' connections array if you maintain one on User model
  if (action === "accept") {
    await User.findByIdAndUpdate(connection.requester, { $addToSet: { connections: connection.recipient } });
    await User.findByIdAndUpdate(connection.recipient, { $addToSet: { connections: connection.requester } });
  }

  // notify both parties
  const io = req.app.get("io");
  if (io) {
    io.to(String(connection.requester)).emit("connection-responded", { action, connection });
    io.to(String(connection.recipient)).emit("connection-responded", { action, connection });
  }

  return res.status(200).json({ success: true, connection });
});

/**
 * GET connection status between authenticated user and :otherId
 */
export const getStatus = catchAsyncErrors(async (req, res) => {
  const otherId = req.params.otherId;
  const meId = String(req.user._id);

  if (!isValidObjectId(otherId)) {
    return res.status(400).json({ success: false, message: "Invalid other user id" });
  }

  const conn = await Connection.findOne({
    $or: [
      { requester: meId, recipient: otherId },
      { requester: otherId, recipient: meId },
    ],
  });

  return res.status(200).json({ success: true, connection: conn || null });
});

/**
 * List accepted connections for the authenticated user
 */
export const myConnections = catchAsyncErrors(async (req, res) => {
  const meId = String(req.user._id);
  const conns = await Connection.find({
    status: "accepted",
    $or: [{ requester: meId }, { recipient: meId }],
  }).populate("requester recipient", "name email role profilePic");
  return res.status(200).json({ success: true, connections: conns });
});
