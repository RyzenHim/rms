// models/customer.model.js

const mongoose = require("mongoose");




const addressSchema = new mongoose.Schema(
    {
        label: {
            type: String,
            enum: ["home", "office", "other"],
            default: "home",
            required: true,
        },
        customLabel: {
            type: String,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
        },

        phone: {
            type: String,
            required: true,
        },

        street: {
            type: String,
            required: true,
        },

        area: String,
        landmark: String,

        city: {
            type: String,
            required: true,
        },

        state: {
            type: String,
            required: true,
        },

        pincode: {
            type: String,
            required: true,
        },

        country: {
            type: String,
            default: "India",
        },

        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
            },
        },

        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    { _id: true }
);


const customerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        phone: {
            type: String,
        },

        addresses: [addressSchema],

        loyaltyPoints: {
            type: Number,
            default: 0,
        },

        totalOrders: {
            type: Number,
            default: 0,
        },

        lastOrderDate: {
            type: Date,
        },

        isBlocked: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Customer", customerSchema);