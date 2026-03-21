const mongoose = require("mongoose");

const inventoryTransactionSchema = new mongoose.Schema(
    {
        inventoryItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inventory",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0.001,
        },
        direction: {
            type: String,
            enum: ["in", "out"],
            required: true,
        },
        source: {
            type: String,
            enum: ["manual_adjustment", "order_served", "scanner_import", "item_created"],
            required: true,
        },
        reason: {
            type: String,
            default: "",
            trim: true,
        },
        notes: {
            type: String,
            default: "",
            trim: true,
        },
        resultingStock: {
            type: Number,
            required: true,
            min: 0,
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null,
        },
        menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuItem",
            default: null,
        },
        menuItemName: {
            type: String,
            default: "",
            trim: true,
        },
        eventContext: {
            type: String,
            default: "",
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

inventoryTransactionSchema.index({ inventoryItem: 1, createdAt: -1 });
inventoryTransactionSchema.index({ order: 1, createdAt: -1 });
inventoryTransactionSchema.index({ source: 1, createdAt: -1 });

module.exports = mongoose.model("InventoryTransaction", inventoryTransactionSchema);
