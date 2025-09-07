// backend/database/dbConnection.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.DB_URL || "mongodb://127.0.0.1:27017/kesh";
const DB_NAME = process.env.DB_NAME || "kesh";

const dbConnection = async () => {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    console.log("MongoDB Connected Successfully!");
  } catch (error) {
    console.error("MongoDB connection error:", error?.message || error);
    throw error;
  }
};

export default dbConnection;
