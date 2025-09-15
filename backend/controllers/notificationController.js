// backend/controllers/notificationController.js
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import Notification from "../models/notificationSchema.js";

/**
 * Create a notification (helper)
 * Not exported as route, but useful to call from other controllers.
 */
export const createNotification = async ({ userId, title, body, meta, req }) => {
  const notif = await Notification.create({
    user: userId,
    title: title || "Notification",
    body: body || "",
    meta: meta || {},
  });

  // emit socket event if io available
  try {
    const io = req?.app?.get?.("io");
    if (io && userId) {
      // send to a room named by userId (server should join sockets to that room)
      io.to(String(userId)).emit("notification", {
        id: notif._id,
        title: notif.title,
        body: notif.body,
        meta: notif.meta,
        createdAt: notif.createdAt,
      });
    }
  } catch (e) {
    console.warn("createNotification: io emit failed", e && e.message ? e.message : e);
  }

  return notif;
};

/**
 * GET /api/v1/notifications
 * Query: ?unreadOnly=true (optional)
 */
export const getNotifications = catchAsyncErrors(async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });
  const unreadOnly = req.query.unreadOnly === "true" || false;

  const filter = { user: req.user._id };
  if (unreadOnly) filter.read = false;

  const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

  res.status(200).json({ success: true, notifications: items, unreadCount });
});

/**
 * POST /api/v1/notifications/mark-read
 * Body: { ids: [id1, id2] } or { all: true }
 */
export const markNotificationsRead = catchAsyncErrors(async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });
  const { ids, all } = req.body;

  if (all) {
    await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
    return res.status(200).json({ success: true, message: "All notifications marked read" });
  }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: "No ids provided" });
  }

  await Notification.updateMany({ _id: { $in: ids }, user: req.user._id }, { $set: { read: true } });

  return res.status(200).json({ success: true, message: "Marked read", ids });
});
