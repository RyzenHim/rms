const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    tableNumber: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    location: {
      type: String,
      enum: ["window", "corner", "center", "outdoor", "private"],
      default: "center",
    },
    shape: {
      type: String,
      enum: ["round", "square", "rectangular"],
      default: "square",
    },
    status: {
      type: String,
      enum: ["available", "reserved", "occupied", "maintenance"],
      default: "available",
    },
    description: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for quick lookup
tableSchema.index({ status: 1, capacity: 1 });
tableSchema.index({ restaurant: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model("Table", tableSchema);
