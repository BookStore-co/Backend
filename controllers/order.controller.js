const Order = require("../models/Order");

const fetchOrdersBySeller = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const orders = await Order.find({ sellerId })
      .populate("userId", "name email")
      .populate("Items.BookId", "title price thumbnail")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalOrders: orders.length,
      orders,
    });
  } catch (err) {
    console.error("Error fetching seller orders:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching seller orders",
      error: err.message,
    });
  }
};

const fetchOrderbyorderId = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId)
      .populate("userId", "name email")
      .populate("Items.BookId", "title price thumbnail");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    order.status = "cancelled";

    order.isArchived  = true;    
    order.archivedAt = new Date();
    

    await order.save();
    res.status(200).json({ message: "Order cancelled", order });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
module.exports = { fetchOrdersBySeller, fetchOrderbyorderId, cancelOrder };
