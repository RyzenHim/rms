const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
    {
        menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuItem",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        notes: {
            type: String,
            default: "",
            trim: true,
        },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        serviceType: {
            type: String,
            enum: ["dine_in", "online"],
            default: "dine_in",
        },
        tableNumber: {
            type: String,
            required: true,
            trim: true,
        },
        deliveryAddress: {
            type: String,
            default: "",
            trim: true,
        },
        customerName: {
            type: String,
            default: "",
            trim: true,
        },
        customerEmail: {
            type: String,
            default: "",
            trim: true,
            lowercase: true,
        },
        customerPhone: {
            type: String,
            default: "",
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: {
            type: [orderItemSchema],
            default: [],
            validate: {
                validator: (value) => Array.isArray(value) && value.length > 0,
                message: "Order must contain at least one item",
            },
        },
        status: {
            type: String,
            enum: [
                "placed",
                "received",
                "preparing",
                "done_preparing",
                "served",
                "cancelled",
            ],
            default: "placed",
        },
        notes: {
            type: String,
            default: "",
            trim: true,
        },
        subTotal: {
            type: Number,
            required: true,
            min: 0,
        },
        taxAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        grandTotal: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "refunded"],
            default: "pending",
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "card", "upi", "other", ""],
            default: "",
        },
        paidAt: {
            type: Date,
            default: null,
        },
        paymentNote: {
            type: String,
            default: "",
            trim: true,
        },
        readyAt: {
            type: Date,
            default: null,
        },
        readyNotification: {
            sent: {
                type: Boolean,
                default: false,
            },
            sentAt: {
                type: Date,
                default: null,
            },
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Order", orderSchema);
