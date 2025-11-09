const Cart = require("../models/Cart");
const Book = require("../models/Books");
const Order = require("../models/Order");
const User = require("../models/User");
const Address = require("../models/Address"); // added import

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
      shippingAddress = {},
      paymentMethod = "cash_on_delivery",
      paymentDetails,
      orderNotes = "",
    } = req.body;

    const hasRequired =
      shippingAddress &&
      (shippingAddress.street || shippingAddress.street === "") &&
      (shippingAddress.city || shippingAddress.city === "") &&
      (shippingAddress.state || shippingAddress.state === "") &&
      (shippingAddress.zipCode || shippingAddress.zip);

    if (!hasRequired) {
      const savedAddr = await Address.findOne({ userId });
      if (savedAddr) {
        shippingAddress = {
          fullName:
            shippingAddress.fullName ||
            savedAddr.fullName ||
            savedAddr.name ||
            "",
          email: shippingAddress.email || savedAddr.email || "",
          phone: shippingAddress.phone || savedAddr.phone || "",
          street: shippingAddress.street || savedAddr.street,
          city: shippingAddress.city || savedAddr.city,
          state: shippingAddress.state || savedAddr.state,
          zipCode: String(
            shippingAddress.zipCode ||
              shippingAddress.zip ||
              savedAddr.zipCode ||
              savedAddr.zip ||
              ""
          ),
          country: shippingAddress.country || savedAddr.country || "India",
        };
      } else {
        return res.status(400).json({
          success: false,
          message:
            "Shipping address incomplete. Provide street, city, state and zipCode.",
        });
      }
    } else {
      shippingAddress.zipCode = String(
        shippingAddress.zipCode || shippingAddress.zip || ""
      );
      shippingAddress.country = shippingAddress.country || "India";
    }

    if (
      !shippingAddress.fullName ||
      !shippingAddress.email ||
      !shippingAddress.phone
    ) {
      const userProfile = await User.findById(userId).select("name email phone");
      if (userProfile) {
        shippingAddress.fullName =
          shippingAddress.fullName || userProfile.name || "Customer";
        shippingAddress.email =
          shippingAddress.email || userProfile.email || "";
        shippingAddress.phone =
          shippingAddress.phone || userProfile.phone || "";
      }
    }

    console.log("Checkout request:", {
      userId,
      shippingAddress,
      paymentMethod,
    });

    const cart = await Cart.findOne({ userId }).populate("Items.BookId");

    if (!cart || cart.Items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty. Please add items to cart before checkout.",
      });
    }

    const stockErrors = [];
    for (const item of cart.Items) {
      const book = await Book.findById(item.BookId._id || item.BookId);
      if (!book) {
        stockErrors.push(
          `Book "${item.BookId?.title || item.BookId}" is no longer available`
        );
      } else if (book.stock < item.quantity) {
        stockErrors.push(
          `Only ${book.stock} copies of "${book.title}" are available, but you requested ${item.quantity}`
        );
      }
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Stock validation failed",
        errors: stockErrors,
      });
    }

    let totalPrice = 0;
    const orderItems = [];

    for (const item of cart.Items) {
      const book = item.BookId;
      const discountedPrice = book.price * (1 - (book.discount || 0) / 100);
      const itemTotal = discountedPrice * item.quantity;
      totalPrice += itemTotal;

      orderItems.push({
        BookId: book._id,
        quantity: item.quantity,
        price: book.price,
        discount: book.discount || 0,
        finalPrice: discountedPrice,
      });
    }

    const order = new Order({
      userId,
      Items: orderItems,
      totalPrice: totalPrice,
      shippingAddress: {
        fullName: shippingAddress.fullName || "Customer",
        email: shippingAddress.email || "",
        phone: shippingAddress.phone || "",
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country || "India",
      },
      paymentMethod,
      paymentDetails: paymentDetails || {},
      status: "pending",
      orderDate: new Date(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      orderNotes,
    });

    await order.save();

    for (const item of cart.Items) {
      await Book.findByIdAndUpdate(
        item.BookId._id || item.BookId,
        { $inc: { stock: -item.quantity, sold: item.quantity } },
        { new: true }
      );
    }

    await Cart.findOneAndDelete({ userId });

    const populatedOrder = await Order.findById(order._id)
      .populate("Items.BookId", "title author price coverImage")
      .populate("userId", "name email");

    res.status(200).json({
      success: true,
      message: "Order placed successfully!",
      orderId: order._id,
      order: populatedOrder,
      orderSummary: {
        totalItems: cart.Items.length,
        totalAmount: totalPrice,
        orderNumber: order._id,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during checkout",
      error: error.message,
    });
  }
};


module.exports = {
  addToCart,
  showInCart,
  removeFromCart,
  updateCartItem,
  checkOut,
};
