const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(user) {
  return jwt.sign(
    { uid: user._id.toString(), userType: user.userType },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// Strip sensitive/internal fields before sending a user back to the client
function toPublicUser(user) {
  return {
    uid: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    userType: user.userType,
    phoneNumber: user.phoneNumber,
    photoURL: user.photoURL,
    businessName: user.businessName,
    businessType: user.businessType,
    address: user.address,
    city: user.city,
    province: user.province,
    zipCode: user.zipCode,
    location: user.location,
    rating: user.rating,
    emailVerified: user.emailVerified,
  };
}

// ---------- Register a client (user) ----------
router.post("/register", async (req, res) => {
  try {
    const { email, password, phoneNumber, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      userType: "user",
      displayName: displayName || email.split("@")[0],
      phoneNumber: phoneNumber || null,
    });

    const token = signToken(user);
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ---------- Register a seller ----------
router.post("/register-seller", async (req, res) => {
  try {
    const {
      email,
      password,
      phoneNumber,
      businessName,
      businessType,
      address,
      city,
      province,
      zipCode,
      location,
    } = req.body;

    if (!email || !password || !businessName || !address || !city) {
      return res.status(400).json({ error: "Missing required seller fields" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      userType: "seller",
      displayName: businessName,
      phoneNumber: phoneNumber || null,
      businessName,
      businessType: businessType || "Food Seller",
      address,
      city,
      province: province || null,
      zipCode: zipCode || null,
      location: location || { latitude: null, longitude: null },
    });

    const token = signToken(user);
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (error) {
    console.error("Register seller error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ---------- Email/password login ----------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user);
    res.json({ token, user: toPublicUser(user) });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// ---------- Google sign-in (clients only) ----------
// Client sends the Google ID token it received from Google's sign-in flow.
// This route verifies it server-side, then finds or creates the user.
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({ error: "Invalid Google token" });
    }

    let user = await User.findOne({ email: payload.email.toLowerCase() });

    if (!user) {
      user = await User.create({
        email: payload.email,
        googleId: payload.sub,
        userType: "user",
        displayName: payload.name || payload.email.split("@")[0],
        photoURL: payload.picture || null,
        emailVerified: !!payload.email_verified,
      });
    } else if (!user.googleId) {
      // Existing email/password account signing in with Google for the first time
      user.googleId = payload.sub;
      await user.save();
    }

    const token = signToken(user);
    res.json({ token, user: toPublicUser(user) });
  } catch (error) {
    console.error("Google sign-in error:", error);
    res.status(401).json({ error: "Google sign-in failed" });
  }
});

// ---------- Get current user (rehydrate session on app load) ----------
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.uid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ---------- Update profile ----------
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const allowedFields = [
      "displayName",
      "phoneNumber",
      "photoURL",
      "address",
      "city",
      "province",
      "zipCode",
      "businessName",
      "businessType",
      "location",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.auth.uid, updates, {
      new: true,
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ---------- Change password ----------
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new password are required" });
    }
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "New password must be at least 8 characters" });
    }

    const user = await User.findById(req.auth.uid).select("+password");
    if (!user || !user.password) {
      return res
        .status(400)
        .json({ error: "Password change isn't available for this account" });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

module.exports = router;