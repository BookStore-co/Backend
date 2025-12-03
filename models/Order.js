  const mongoose = require("mongoose");

  const orderSchema = new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      Items: [
        {
          BookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 1,
          },
          price: {
            type: Number,
            required: true,
          },
          discount: {
            type: Number,
            default: 0,
          },
          finalPrice: {
            type: Number,
            required: true,
          },
        },
      ],
      totalPrice: {
        type: Number,
        required: true,
      },
      shippingAddress: {
        fullName: {
          type: String,
          default: "",
        },
        email: {
          type: String,
          default: "",
        },
        phone: {
          type: String,
          default: "",
        },
        street: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        zipCode: {
          type: String,
          required: true,
        },
        country: {
          type: String,
          default: "India",
        },
      },
      paymentMethod: {
        type: String,
        enum: ["cash_on_delivery", "razorpay"],
        default: "cash_on_delivery",
      },
      paymentDetails: {
        orderId: { type: String },
        paymentId: { type: String },
        signature: { type: String },
      },
      paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
      },
      status: {
        type: String,
        enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
        default: "confirmed",
      },
      orderDate: {
        type: Date,
        default: Date.now,
      },
      estimatedDelivery: {
        type: Date,
      },
      orderNotes: {
        type: String,
        default: "",
      },
       isArchived : {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      index: { expires: '30d' } 
    }
    },   
    {
      timestamps: true,
    }
  );

  module.exports = mongoose.model("orders", orderSchema);
