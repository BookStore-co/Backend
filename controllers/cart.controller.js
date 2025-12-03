const Cart = require("../models/Cart");
const Book = require("../models/Books");
const Order = require("../models/Order");
const User = require("../models/User");
const Address = require("../models/Address");
const Razorpay = require("razorpay");
const dotenv = require("dotenv");
const crypto = require("crypto");
const mongoose = require("mongoose"); // add if not present
dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId, quantity } = req.body;

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Find the user's cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Create new cart if not found
      cart = new Cart({
        userId,
        Items: [{ BookId: bookId, quantity }],
        totalPrice: book.price * quantity,
      });
    } else {
      // Find if book already exists in cart
      const existingItemIdx = cart.Items.findIndex(
        (item) => item.BookId.toString() === bookId
      );

      if (existingItemIdx > -1) {
        // Increase quantity if already in cart
        cart.Items[existingItemIdx].quantity += quantity;
      } else {
        // Add new book
        cart.Items.push({ BookId: bookId, quantity });
      }

      // Recalculate total price
      let totalPrice = 0;
      for (const item of cart.Items) {
        const b = await Book.findById(item.BookId);
        totalPrice += b.price * item.quantity;
      }

      cart.totalPrice = totalPrice;
    }

    // Save cart to DB
    await cart.save();
    res.status(200).json({ message: "Book added to cart", cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const showInCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId }).populate("Items.BookId");

    if (cart == null) {
      return res
        .status(200)
        .json({ message: "Cart is empty", cart: { Items: [] } });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.bookId;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemidx = cart.Items.findIndex(
      (item) => item.BookId.toString() === bookId
    );

    if (itemidx === -1) {
      return res.status(404).json({ message: "Book not in cart" });
    }

    cart.Items.splice(itemidx, 1);

    let totalPrice = 0;

    for (const item of cart.Items) {
      const b = await Book.findById(item.BookId);
      totalPrice += b.price * item.quantity;
    }
    cart.totalPrice = totalPrice;

    await cart.save();
    res.status(200).json({ message: "Book removed from cart", cart });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId, quantity } = req.body;

    if (!bookId || quantity === undefined) {
      return res
        .status(400)
        .json({ message: "Book ID and quantity are required" });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIdx = cart.Items.findIndex(
      (item) => item.BookId.toString() === bookId
    );

    if (itemIdx === -1) {
      return res.status(404).json({ message: "Book not in cart" });
    }

    if (quantity <= 0) {
      cart.Items.splice(itemIdx, 1);
    } else {
      cart.Items[itemIdx].quantity = quantity;
    }

    let totalPrice = 0;

    for (const item of cart.Items) {
      const b = await Book.findById(item.BookId);
      if (b) {
        const discountedPrice = b.price * (1 - (b.discount || 0) / 100);
        totalPrice += discountedPrice * item.quantity;
      }
    }

    cart.totalPrice = totalPrice;

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate("Items.BookId");

    res.status(200).json({ message: "Cart updated", cart: updatedCart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    let {
      addressId,
      shippingAddress = {},
      paymentMethod = "cash_on_delivery",
      paymentDetails,
      orderNotes = "",
    } = req.body;

    // ==========================
    // 1️⃣ Handle Address
    // ==========================
    if (addressId) {
      const savedAddr = await Address.findById(addressId);
      if (!savedAddr)
        return res
          .status(404)
          .json({ success: false, message: "Address not found" });

      shippingAddress = {
        fullName: savedAddr.fullName || "",
        email: savedAddr.email || "",
        phone: savedAddr.phone || "",
        street: savedAddr.street,
        city: savedAddr.city,
        state: savedAddr.state,
        zipCode: savedAddr.zip || savedAddr.zipCode,
        country: savedAddr.country || "India",
      };
    }

    const userProfile = await User.findById(userId).select("name email mobno");
    if (userProfile) {
      shippingAddress.fullName = shippingAddress.fullName || userProfile.name;
      shippingAddress.email = shippingAddress.email || userProfile.email;
      shippingAddress.phone = shippingAddress.phone || userProfile.mobno;
    }

    // ==========================
    // 2️⃣ Fetch Cart
    // ==========================
    const cart = await Cart.findOne({ userId }).populate("Items.BookId");
    if (!cart || cart.Items.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "Cart is empty!" });

    // ==========================
    // 3️⃣ Validate Stock + Group Items by Seller
    // ==========================
    const sellerGroups = {};

    for (const item of cart.Items) {
      const book = item.BookId;

      // Check stock
      if (book.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${book.title}`,
        });
      }

      const finalPrice = book.price * (1 - (book.discount || 0) / 100);

      // determine seller id from book document (prefer userId or sellerId)
      // Books model stores seller in `seller` field (ref: 'User').
      const sellerId = book.seller ? String(book.seller) : null;

      // If seller is not present on the book record, abort — avoid using BookId as sellerId
      if (!sellerId) {
        return res.status(500).json({
          success: false,
          message: `Seller not found for book ${book._id}`,
        });
      }

      if (!sellerGroups[sellerId]) sellerGroups[sellerId] = [];

      sellerGroups[sellerId].push({
        BookId: book._id,
        quantity: item.quantity,
        price: book.price,
        discount: book.discount,
        finalPrice,
      });
    }

    // ==========================
    // 4️⃣ Razorpay Payment (creates only payment, not order)
    // ==========================
    if (paymentMethod === "razorpay") {
      let totalAmount = 0;

      for (const sellerId in sellerGroups) {
        const items = sellerGroups[sellerId];
        for (const it of items) totalAmount += it.finalPrice * it.quantity;
      }

      const options = {
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: "receipt_" + Date.now(),
      };

      const razorpayOrder = await razorpay.orders.create(options);

      return res.status(200).json({
        success: true,
        message: "Razorpay order created",
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    // ==========================
    // 5️⃣ COD — Create Separate Orders per Seller
    // ==========================
    const createdOrders = [];

    for (const sellerId in sellerGroups) {
      const sellerItems = sellerGroups[sellerId];

      let sellerTotalPrice = 0;
      sellerItems.forEach(
        (i) => (sellerTotalPrice += i.finalPrice * i.quantity)
      );

      const newOrder = await Order.create({
        userId,
        sellerId, // CORRECT SELLER ID
        Items: sellerItems,
        totalPrice: sellerTotalPrice,
        shippingAddress,
        paymentMethod,
        status: "pending",
        orderNotes,
        orderDate: new Date(),
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      createdOrders.push(newOrder);
    }

    // ==========================
    // 6️⃣ Update Stock & Clear Cart
    // ==========================
    for (const item of cart.Items) {
      await Book.findByIdAndUpdate(item.BookId, {
        $inc: { stock: -item.quantity, sold: item.quantity },
      });
    }

    await Cart.findOneAndDelete({ userId });

    // ==========================
    // 7️⃣ Final Response
    // ==========================
    return res.status(200).json({
      success: true,
      message: "COD order(s) placed successfully!",
      orders: createdOrders,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during checkout",
      error: error.message,
    });
  }
};

// verify razorpay payment, create order, update stock and clear cart
const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      paymentDetails,
      shippingAddress: reqShippingAddress,
      addressId,
      orderNotes,
    } = req.body;

    // verify razorpay signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    // fetch cart
    const cart = await Cart.findOne({ userId }).populate("Items.BookId");
    if (!cart || cart.Items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Resolve shippingAddress:
    // Priority: request shippingAddress -> cart.shippingAddress -> addressId (saved addr) -> user profile
    let shippingAddress = reqShippingAddress || cart.shippingAddress || {};

    if (addressId && (!shippingAddress.street || !shippingAddress.city)) {
      const savedAddr = await Address.findById(addressId);
      if (savedAddr) {
        shippingAddress = {
          fullName: savedAddr.fullName || "",
          email: savedAddr.email || "",
          phone: savedAddr.phone || "",
          street: savedAddr.street,
          city: savedAddr.city,
          state: savedAddr.state,
          zipCode: savedAddr.zip || savedAddr.zipCode,
          country: savedAddr.country || "India",
        };
      }
    }

    // Fill from user profile if still missing
    const userProfile = await User.findById(userId).select("name email mobno");
    if (userProfile) {
      shippingAddress.fullName = shippingAddress.fullName || userProfile.name;
      shippingAddress.email = shippingAddress.email || userProfile.email;
      shippingAddress.phone = shippingAddress.phone || userProfile.mobno;
    }

    // Validate required address fields expected by Order schema
    const requiredFields = ["street", "city", "state", "zipCode"];
    const missing = requiredFields.filter((f) => !shippingAddress[f]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing shipping address fields: ${missing.join(
          ", "
        )}. Provide shippingAddress in request or complete user/address data.`,
      });
    }

    // Rebuild sellerGroups from cart items
    const sellerGroups = {};
    for (const item of cart.Items) {
      const book = item.BookId;
      if (!book) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid book in cart" });
      }

      if (book.stock < item.quantity) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Insufficient stock for ${book.title}`,
          });
      }

      const finalPrice = book.price * (1 - (book.discount || 0) / 100);
      const sellerId = book.seller ? String(book.seller) : null;
      if (!sellerId) {
        return res
          .status(500)
          .json({
            success: false,
            message: `Seller not found for book ${book._id}`,
          });
      }

      if (!sellerGroups[sellerId]) sellerGroups[sellerId] = [];
      sellerGroups[sellerId].push({
        BookId: book._id,
        quantity: item.quantity,
        price: book.price,
        discount: book.discount,
        finalPrice,
      });
    }

    // Create orders per seller (razorpay = paid)
    const createdOrders = [];
    for (const sellerId in sellerGroups) {
      const sellerItems = sellerGroups[sellerId];
      let sellerTotalPrice = 0;
      sellerItems.forEach(
        (i) => (sellerTotalPrice += i.finalPrice * i.quantity)
      );

      const newOrder = await Order.create({
        userId,
        sellerId,
        Items: sellerItems,
        totalPrice: sellerTotalPrice,
        shippingAddress,
        paymentMethod: "razorpay",
        paymentDetails: paymentDetails || {
          razorpay_payment_id,
          razorpay_order_id,
        },
        paymentStatus: "completed",
        status: "confirmed",
        orderNotes: orderNotes || cart.orderNotes || "",
        orderDate: new Date(),
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      createdOrders.push(newOrder);
    }

    // Update stock & clear cart
    for (const item of cart.Items) {
      await Book.findByIdAndUpdate(item.BookId, {
        $inc: { stock: -item.quantity, sold: item.quantity },
      });
    }

    await Cart.findOneAndDelete({ userId });

    return res.status(200).json({
      success: true,
      message: "Payment verified and order(s) created",
      orders: createdOrders,
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const getTotalMoney = async (req, res) => {
  try {
    const orders = await Order.find({ paymentStatus: "completed" });

    let totalRevenue = 0;

    for (const order of orders) {
      totalRevenue += order.totalPrice;
    }

    return res
      .status(200)
      .json({ success: true, totalRevenue, totalOrders: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  addToCart,
  showInCart,
  removeFromCart,
  updateCartItem,
  checkOut,
  verifyPayment,
  getTotalMoney,
};
