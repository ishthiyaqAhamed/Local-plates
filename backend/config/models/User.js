const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Not required: users who sign in via Google have no password
    password: { type: String, select: false },
    googleId: { type: String, default: null },

    userType: { type: String, enum: ["user", "seller"], required: true },
    displayName: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    photoURL: { type: String, default: null },

    // Seller-only fields
    businessName: { type: String, default: null },
    businessType: { type: String, default: null },
    address: { type: String, default: null },
    city: { type: String, default: null },
    province: { type: String, default: null },
    zipCode: { type: String, default: null },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    rating: { type: Number, default: 0 },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);