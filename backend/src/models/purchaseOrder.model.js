const mongoose = require("mongoose");

const purchaseOrderItemSchema = new mongoose.Schema(
    {
        inventoryItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inventory",
            required: true,
        },
        itemName: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            default: "",
            trim: true,
        },
        unit: {
            type: String,
            default: "",
            trim: true,
        },
        orderedQuantity: {
            type: Number,
            required: true,
            min: 0.001,
        },
        receivedQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        lineTotal: {
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

const purchasePaymentSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            required: true,
            min: 0.01,
        },
        method: {
            type: String,
            enum: ["cash", "bank_transfer", "upi", "card", "other"],
            default: "other",
        },
        note: {
            type: String,
            default: "",
            trim: true,
        },
        paidAt: {
            type: Date,
            default: Date.now,
        },
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { _id: false }
);

const purchaseAuditEntrySchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true,
            trim: true,
        },
        note: {
            type: String,
            default: "",
            trim: true,
        },
        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        actorRoles: {
            type: [String],
            default: [],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
    {
        purchaseOrderNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
        },
        sourceRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StockRequest",
            default: null,
        },
        items: {
            type: [purchaseOrderItemSchema],
            default: [],
            validate: {
                validator: (value) => Array.isArray(value) && value.length > 0,
                message: "Purchase order must contain at least one item",
            },
        },
        status: {
            type: String,
            enum: ["draft", "ordered", "partially_received", "received", "cancelled"],
            default: "draft",
        },
        paymentStatus: {
            type: String,
            enum: ["unpaid", "partial", "paid"],
            default: "unpaid",
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        totalPaid: {
            type: Number,
            default: 0,
            min: 0,
        },
        balanceDue: {
            type: Number,
            required: true,
            min: 0,
        },
        notes: {
            type: String,
            default: "",
            trim: true,
        },
        expectedDeliveryDate: {
            type: Date,
            default: null,
        },
        orderedAt: {
            type: Date,
            default: Date.now,
        },
        receivedAt: {
            type: Date,
            default: null,
        },
        payments: {
            type: [purchasePaymentSchema],
            default: [],
        },
        lastPaymentConfirmedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        lastPaymentConfirmedAt: {
            type: Date,
            default: null,
        },
        auditTrail: {
            type: [purchaseAuditEntrySchema],
            default: [],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

purchaseOrderSchema.index({ supplier: 1, createdAt: -1 });
purchaseOrderSchema.index({ status: 1, paymentStatus: 1, createdAt: -1 });

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
