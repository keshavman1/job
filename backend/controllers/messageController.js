// backend/controllers/messageController.js
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Message } from "../models/messageSchema.js";
import { Connection } from "../models/connectionSchema.js";

/**
 * Helper: check if two users are connected (accepted)
 */
const isConnected = async (a, b) => {
  const c = await Connection.findOne({
    status: "accepted",
    $or: [
      { requester: a, recipient: b },
      { requester: b, recipient: a },
    ],
  });
  return Boolean(c);
};

/**
 * GET /api/v1/messages/:otherId
 * List messages between req.user and otherId (paginated optional)
 */
export const listMessages = catchAsyncErrors(async (req, res, next) => {
  const otherId = req.params.otherId;
  const meId = String(req.user._id);

  const connected = await isConnected(meId, otherId);
  if (!connected) return next(new ErrorHandler("You must be connected to view messages.", 403));

  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  const before = req.query.before ? new Date(req.query.before) : null;

  const query = {
    $or: [
      { sender: meId, receiver: otherId },
      { sender: otherId, receiver: meId },
    ],
  };

  if (before) query.createdAt = { $lt: before };

  const messages = await Message.find(query).sort({ createdAt: -1 }).limit(limit);
  return res.status(200).json({ success: true, messages: messages.reverse() });
});

/**
 * POST /api/v1/messages/:otherId
 * Send message to otherId (must be connected)
 * Persists message and emits via Socket.IO
 */
export const sendMessage = catchAsyncErrors(async (req, res, next) => {
  const otherId = req.params.otherId;
  const meId = String(req.user._id);

  const connected = await isConnected(meId, otherId);
  if (!connected) return next(new ErrorHandler("You must be connected to chat.", 403));

  const { content } = req.body;
  if (!content || !String(content).trim()) return next(new ErrorHandler("Message content required.", 400));

  const msg = await Message.create({ sender: meId, receiver: otherId, content });

  // Emit via io (emit to room named by userId)
  const io = req.app.get("io");
  if (io) {
    // Notify recipient
    io.to(String(otherId)).emit("receive-message", {
      _id: msg._id,
      from: meId,
      to: otherId,
      content: msg.content,
      createdAt: msg.createdAt,
    });
    // Optionally notify sender (so sender UI gets message with server timestamp/id)
    io.to(String(meId)).emit("message-sent", {
      _id: msg._id,
      from: meId,
      to: otherId,
      content: msg.content,
      createdAt: msg.createdAt,
    });
  }

  return res.status(201).json({ success: true, message: msg });
});
