// backend/models/userSchema.js
import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your Name!"],
      minLength: [3, "Name must contain at least 3 Characters!"],
      maxLength: [30, "Name cannot exceed 30 Characters!"],
    },
    email: {
      type: String,
      required: [true, "Please enter your Email!"],
      validate: [validator.isEmail, "Please provide a valid Email!"],
      unique: true,
    },
    phone: {
      type: String,
      required: [true, "Please enter your Phone Number!"],
    },
    password: {
      type: String,
      required: [true, "Please provide a Password!"],
      minLength: [8, "Password must contain at least 8 characters!"],
      maxLength: [32, "Password cannot exceed 32 characters!"],
      select: false,
    },
    role: {
      type: String,
      required: [true, "Please select a role"],
      enum: ["Job Seeker", "Employer"],
    },

    skills: { type: [String], default: [] },
    about: { type: String, default: "" },

    // legacy / UI fields
    resumePath: { type: String, default: "" },
    profilePhotoPath: { type: String, default: "" },

    // employer-specific
    companyDescription: { type: String, default: "" },
    hiringRoles: { type: [String], default: [] },

    // multer-backed upload fields
    resume: { type: String, default: null },
    profilePic: { type: String, default: null },

    // accepted connections
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ------- QUIZ FIELDS (new) -------
    quizCompleted: { type: Boolean, default: false },
    quizAnswers: {
      // store raw answers array: [{ qId, answer }]
      type: [{ qId: String, answer: String }],
      default: [],
    },
    quizSummary: {
      // small summary e.g. { matchCount: Number, matchedJobIds: [ObjectId], skillsSelected: [String] }
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
