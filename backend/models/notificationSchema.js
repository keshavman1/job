// backend/models/notificationSchema.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // recipient
    title: { type: String, required: true },
    body: { type: String, default: "" },
    meta: { type: Object, default: {} }, // e.g., { applicationId, type: 'application-status' }
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;
