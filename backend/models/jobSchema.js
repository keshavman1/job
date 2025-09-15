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
      maxLength: [5000, "Description cannot exceed 5000 Characters!"],
    },
    companyName: {
      type: String,
      required: [true, "Please provide company name."],
      trim: true,
    },
    category: { type: String, default: "" },
    country: { type: String, default: "" },
    city: { type: String, default: "" },
    location: { type: String, default: "" },

    fixedSalary: { type: Number, default: null },
    salaryFrom: { type: Number, default: null },
    salaryTo: { type: Number, default: null },

    expired: { type: Boolean, default: false },

    skills: { type: [String], default: [] },

    jobPostedOn: { type: Date, default: Date.now },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    vacancies: { type: Number, default: 1 },
    employmentType: { type: String, default: "" },
    locationType: { type: String, default: "" },

    applicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
export default Job;
