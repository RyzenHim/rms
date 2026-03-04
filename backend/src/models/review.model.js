const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      default: "",
    },
    comment: {
      type: String,
      default: "",
    },
    highlights: {
      type: [String],
      default: [], // e.g., ["Fresh", "Tasty", "Value for money"]
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
    helpful: {
      type: Number,
      default: 0, // Number of people who found it helpful
    },
    images: {
      type: [String],
      default: [], // URLs of review images
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
  },
  { timestamps: true }
);

// Compound index for better query performance
reviewSchema.index({ menuItem: 1, createdAt: -1 });
reviewSchema.index({ customer: 1, menuItem: 1 }, { unique: true }); // One review per customer per item

module.exports = mongoose.model("Review", reviewSchema);
