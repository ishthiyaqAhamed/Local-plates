const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
    available: { type: Boolean, default: true },

    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sellerName: { type: String, default: null },
    sellerLocation: { type: String, default: null },

    type: { type: String, required: true }, // category, e.g. "Rice", "Pizza"
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);