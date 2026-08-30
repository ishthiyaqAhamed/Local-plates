const express = require("express");
const User = require("../models/User");

const router = express.Router();

function toPublicShop(user) {
  return {
    uid: user._id.toString(),
    businessName: user.businessName || "Unknown Shop",
    businessType: user.businessType || "Unknown",
    address: user.address || "No address",
    city: user.city || "Unknown",
    province: user.province || "Unknown",
    zipCode: user.zipCode || "00000",
    phone: user.phoneNumber || "No phone",
    email: user.email,
    rating: user.rating || 0,
    photoURL: user.photoURL || null,
    userType: user.userType,
    location: user.location || null,
    createdAt: user.createdAt,
  };
}

// ---------- List all sellers (shops) ----------
router.get("/", async (req, res) => {
  try {
    const sellers = await User.find({ userType: "seller" });
    res.json({ shops: sellers.map(toPublicShop) });
  } catch (error) {
    console.error("List shops error:", error);
    res.status(500).json({ error: "Failed to fetch shops" });
  }
});

// ---------- Get one shop ----------
router.get("/:id", async (req, res) => {
  try {
    const seller = await User.findOne({ _id: req.params.id, userType: "seller" });
    if (!seller) {
      return res.status(404).json({ error: "Shop not found" });
    }
    res.json({ shop: toPublicShop(seller) });
  } catch (error) {
    console.error("Get shop error:", error);
    res.status(500).json({ error: "Failed to fetch shop" });
  }
});

module.exports = router;