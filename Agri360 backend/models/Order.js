import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    // Parties
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketListing",
      required: true,
    },

    // Order details
    quantity: { type: Number, required: true },
    unit: { type: String },
    pricePerUnit: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    currency: { type: String, default: "EGP" },

    // Status tracking
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "completed",
        "cancelled",
        "refunded",
        "disputed",
      ],
      default: "pending",
    },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        notes: String,
      },
    ],

    // Delivery info
    delivery: {
      method: { type: String, enum: ["pickup", "delivery"] },
      address: String,
      governorate: String,
      city: String,
      phone: String,
      scheduledDate: Date,
      actualDeliveryDate: Date,
      trackingNumber: String,
      deliveryCost: Number,
    },

    // Payment
    payment: {
      method: {
        type: String,
        enum: ["cash", "bank_transfer", "mobile_wallet", "card", "on_delivery"],
      },
      reference: String,
      paidAt: Date,
      amount: Number,
    },

    // Messages between buyer and seller
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: String,
        createdAt: { type: Date, default: Date.now },
        read: { type: Boolean, default: false },
      },
    ],

    // Rating and review (after completion)
    buyerRating: {
      rating: { type: Number, min: 1, max: 5 },
      review: String,
      createdAt: Date,
    },
    sellerRating: {
      rating: { type: Number, min: 1, max: 5 },
      review: String,
      createdAt: Date,
    },

    // Linked to plan (if selling from harvest plan)
    linkedPlan: { type: mongoose.Schema.Types.ObjectId, ref: "HarvestPlan" },

    // Notes
    buyerNotes: String,
    sellerNotes: String,
    internalNotes: String, // Admin notes

    // Cancellation info
    cancellation: {
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: String,
      cancelledAt: Date,
    },
  },
  { timestamps: true }
);

// Indexes
orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ seller: 1, status: 1 });
orderSchema.index({ listing: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
