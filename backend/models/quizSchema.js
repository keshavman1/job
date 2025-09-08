// backend/models/quizSchema.js
import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: {
      // an array of { qId: String, answer: String }
      type: [{ qId: String, answer: String }],
      default: [],
    },
    // convenience quick-snapshot of skills extracted from answers
    skillsSelected: { type: [String], default: [] },

    // match summary stored after processing
    matchCount: { type: Number, default: 0 },
    matchedJobIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],

    // optional details for reporting
    details: { type: Object, default: {} },
  },
  { timestamps: true }
);

export const QuizResult = mongoose.models.QuizResult || mongoose.model("QuizResult", quizResultSchema);
export default QuizResult;
