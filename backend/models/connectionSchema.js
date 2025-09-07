// backend/models/connectionSchema.js
import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
  },
  { timestamps: true }
);

// ensure a single connection document per unordered pair (requester,recipient)
// we create two unique indexes by enforcing requester<recipient order on create OR catch unique error.
// For simplicity keep single index to avoid duplicates in the same direction.
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export const Connection = mongoose.models.Connection || mongoose.model("Connection", connectionSchema);
export default Connection;
