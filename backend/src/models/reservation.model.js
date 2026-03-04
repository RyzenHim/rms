const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    reservationDate: {
      type: Date,
      required: true,
    },
    reservationTime: {
      type: String, // Format: "HH:MM" (e.g., "19:30")
      required: true,
    },
    duration: {
      type: Number,
      default: 120, // Duration in minutes
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "arrived", "completed", "cancelled", "no-show"],
      default: "pending",
    },
    specialRequests: {
      type: String,
      default: "",
    },
    occasion: {
      type: String,
      enum: ["birthday", "anniversary", "business", "casual", "celebration", "other"],
      default: "casual",
    },
    checkinTime: {
      type: Date,
      default: null,
    },
    checkoutTime: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
    cancellationReason: {
      type: String,
      default: "",
    },
    reminder: {
      type: Boolean,
      default: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
reservationSchema.index({ reservationDate: 1, table: 1 });
reservationSchema.index({ customer: 1, createdAt: -1 });
reservationSchema.index({ status: 1, reservationDate: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);
