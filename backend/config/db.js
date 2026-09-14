const mongoose = require("mongoose");

async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.warn("⚠️ MONGO_URI not provided in .env");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.warn("⚠️ MongoDB connection error:", error.message);
  }
}

module.exports = connectDB;