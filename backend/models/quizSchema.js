// backend/models/quizSchema.js
import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: { type: [String], default: [] },
    skillsSelected: { type: [String], default: [] },
    matchCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const QuizResult = mongoose.models.QuizResult || mongoose.model("QuizResult", quizSchema);
export default QuizResult;
