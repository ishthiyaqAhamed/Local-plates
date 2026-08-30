const express = require("express");
const Product = require("../models/Product");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function toPublicProduct(product) {
  return {
    id: product._id.toString(),
    name: product.name,
    description: product.description,
    price: product.price,
    quantity: product.quantity,
    available: product.available,
    sellerId: product.sellerId.toString(),
    sellerName: product.sellerName,
    sellerLocation: product.sellerLocation,
    type: product.type,
    images: product.images,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

// ---------- List all products ----------
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ products: products.map(toPublicProduct) });
  } catch (error) {
    console.error("List products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ---------- List products for one seller ----------
router.get("/seller/:sellerId", async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.params.sellerId });
    res.json({ products: products.map(toPublicProduct) });
  } catch (error) {
    console.error("List seller products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ---------- Create a product (seller only) ----------
router.post("/", requireAuth, async (req, res) => {
  try {
    if (req.auth.userType !== "seller") {
      return res.status(403).json({ error: "Only sellers can add products" });
    }

    const { name, description, price, quantity, type, images, available } = req.body;
    if (!name || price === undefined || !type) {
      return res.status(400).json({ error: "name, price, and type are required" });
    }

    const seller = await User.findById(req.auth.uid);

    const product = await Product.create({
      name,
      description: description || "",
      price,
      quantity: quantity || 0,
      available: available !== undefined ? available : true,
      type,
      images: images || [],
      sellerId: req.auth.uid,
      sellerName: seller?.businessName || seller?.displayName || null,
      sellerLocation: seller?.city || null,
    });

    res.status(201).json({ product: toPublicProduct(product) });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// ---------- Update a product (owner only) ----------
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    if (product.sellerId.toString() !== req.auth.uid) {
      return res.status(403).json({ error: "You don't own this product" });
    }

    const allowedFields = [
      "name",
      "description",
      "price",
      "quantity",
      "available",
      "type",
      "images",
    ];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    }
    await product.save();

    res.json({ product: toPublicProduct(product) });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// ---------- Delete a product (owner only) ----------
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    if (product.sellerId.toString() !== req.auth.uid) {
      return res.status(403).json({ error: "You don't own this product" });
    }

    await product.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;