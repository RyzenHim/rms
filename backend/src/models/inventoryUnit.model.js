const mongoose = require("mongoose");

const inventoryUnitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

inventoryUnitSchema.index({ sortOrder: 1, name: 1 });

module.exports = mongoose.model("InventoryUnit", inventoryUnitSchema);
