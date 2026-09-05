const express = require("express");
const Order = require("../models/Order");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function toPublicOrder(order) {
  return {
    id: order._id.toString(),
    userId: order.userId,
    userName: order.userName,
    userEmail: order.userEmail,
    items: order.items,
    subtotal: order.subtotal,
    appFee: order.appFee,
    total: order.total,
    deliveryInfo: order.deliveryInfo,
    status: order.status,
    paymentType: order.paymentType,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

// ---------- Place a new order ----------
router.post("/", requireAuth, async (req, res) => {
  try {
    const { items, deliveryInfo, paymentType } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Order must include at least one item" });
    }
    if (!deliveryInfo) {
      return res.status(400).json({ error: "deliveryInfo is required" });
    }

    const user = await User.findById(req.auth.uid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const appFee = 50;
    const total = subtotal + appFee + (deliveryInfo.deliveryCharge || 0);

    const order = await Order.create({
      userId: req.auth.uid,
      userName: user.displayName || "Anonymous User",
      userEmail: user.email || "No email provided",
      items,
      subtotal,
      appFee,
      total,
      deliveryInfo,
      status: "pending",
      paymentType: paymentType || "Cash on Delivery",
      paymentStatus: "pending",
    });

    res.status(201).json({ order: toPublicOrder(order) });
  } catch (error) {
    console.error("Place order error:", error);
    res.status(500).json({ error: "Failed to place order" });
  }
});

// ---------- Get current user's orders ----------
router.get("/user/me", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.auth.uid }).sort({
      createdAt: -1,
    });
    res.json({ orders: orders.map(toPublicOrder) });
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ---------- Get current seller's orders (only their items) ----------
router.get("/seller/me", requireAuth, async (req, res) => {
  try {
    if (req.auth.userType !== "seller") {
      return res.status(403).json({ error: "Only sellers can view seller orders" });
    }

    const orders = await Order.find({
      "items.sellerId": req.auth.uid,
    }).sort({ createdAt: -1 });

    const sellerOrders = orders.map((order) => {
      const sellerItems = order.items.filter(
        (item) => item.sellerId === req.auth.uid
      );
      const sellerTotal = sellerItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      return {
        id: order._id.toString(),
        total: sellerTotal,
        status: order.status,
        date: order.createdAt,
        itemCount: sellerItems.length,
      };
    });

    res.json({ orders: sellerOrders });
  } catch (error) {
    console.error("Get seller orders error:", error);
    res.status(500).json({ error: "Failed to fetch seller orders" });
  }
});

// ---------- Get one order ----------
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const isOwner = order.userId === req.auth.uid;
    const isSellerInOrder = order.items.some(
      (item) => item.sellerId === req.auth.uid
    );
    if (!isOwner && !isSellerInOrder) {
      return res.status(403).json({ error: "Not authorized to view this order" });
    }

    res.json({ order: toPublicOrder(order) });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// ---------- Update order status ----------
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const isOwner = order.userId === req.auth.uid;
    const isSellerInOrder = order.items.some(
      (item) => item.sellerId === req.auth.uid
    );
    if (!isOwner && !isSellerInOrder) {
      return res.status(403).json({ error: "Not authorized to update this order" });
    }

    order.status = status;
    await order.save();

    res.json({ order: toPublicOrder(order) });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

module.exports = router;