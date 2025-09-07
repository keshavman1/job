// backend/models/messageSchema.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// index for fast querying conversation history
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

export const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);
export default Message;
