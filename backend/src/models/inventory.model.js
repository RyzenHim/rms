const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    currentStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    minimumThreshold: {
      type: Number,
      required: true,
      min: 1,
      default: 10,
    },
    maximumStock: {
      type: Number,
      required: true,
      min: 1,
      default: 100,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    supplier: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "", // Warehouse/storage location
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    lastRestocked: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for low stock alerts
inventorySchema.index({ currentStock: 1, minimumThreshold: 1 });
inventorySchema.index({ category: 1 });

module.exports = mongoose.model("Inventory", inventorySchema);
