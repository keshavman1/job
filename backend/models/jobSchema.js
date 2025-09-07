// backend/models/jobSchema.js
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title."],
      minLength: [3, "Title must contain at least 3 Characters!"],
      maxLength: [200, "Title cannot exceed 200 Characters!"],
    },
    description: {
      type: String,
      required: [true, "Please provide description."],
      minLength: [30, "Description must contain at least 30 Characters!"],
      maxLength: [5000, "Description cannot exceed 5000 Characters!"],
    },
    category: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },

    // Salary: keep numeric type; avoid using minLength on numbers (invalid).
    fixedSalary: { type: Number, default: null },
    salaryFrom: { type: Number, default: null },
    salaryTo: { type: Number, default: null },

    expired: { type: Boolean, default: false },

    // skills required for this job — used for filtering/matching
    skills: { type: [String], default: [] },

    // when the job was posted (timestamps will also provide createdAt)
    jobPostedOn: { type: Date, default: Date.now },

    // reference to employer
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // optional fields
    vacancies: { type: Number, default: 1 },
    employmentType: { type: String, default: "" }, // e.g., Full-time, Part-time, Contract
    locationType: { type: String, default: "" },   // e.g., Remote, Onsite, Hybrid
  },
  { timestamps: true }
);

export const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
export default Job;
