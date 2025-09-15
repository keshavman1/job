// backend/models/applicationSchema.js
import mongoose from "mongoose";
import validator from "validator";

const applicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your Name!"],
      minLength: [3, "Name must contain at least 3 Characters!"],
      maxLength: [100, "Name cannot exceed 100 Characters!"],
    },
    email: {
      type: String,
      required: [true, "Please enter your Email!"],
      validate: [validator.isEmail, "Please provide a valid Email!"],
    },
    coverLetter: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      required: [true, "Please enter your Phone Number!"],
    },
    address: {
      type: String,
      default: "",
    },

    // resume: supports both cloudinary meta (public_id, url) and local path/originalName
    resume: {
      public_id: { type: String, default: null }, // kept for compatibility (cloudinary)
      url: { type: String, default: "" }, // could be cloud url OR local path (/uploads/...)
      originalName: { type: String, default: "" }, // original filename
    },

    // Reference to job for which this application was made (NEW)
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Associated job is required."],
    },

    applicantID: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        enum: ["Job Seeker"],
        default: "Job Seeker",
      },
    },

    employerID: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        enum: ["Employer"],
        default: "Employer",
      },
    },

    // application status (optional)
    status: {
      type: String,
      enum: ["submitted", "reviewing", "shortlisted", "rejected", "hired"],
      default: "submitted",
    },

    // you can add meta fields here if required (notes, rating, etc.)
  },
  { timestamps: true }
);

/**
 * Compound unique index prevents a user from applying more than once to the same job:
 * uniqueness on (applicantID.user + job)
 */
applicationSchema.index({ "applicantID.user": 1, job: 1 }, { unique: true });

export const Application =
  mongoose.models.Application || mongoose.model("Application", applicationSchema);
export default Application;
