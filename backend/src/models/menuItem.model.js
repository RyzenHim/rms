const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        shortDescription: {
            type: String,
            default: "",
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodCategory",
            required: true,
        },
        image: {
            type: String,
            default: "",
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        compareAtPrice: {
            type: Number,
            min: 0,
            default: null,
        },
        calories: {
            type: Number,
            min: 0,
            default: 0,
        },
        prepTimeMinutes: {
            type: Number,
            min: 0,
            default: 20,
        },
        spiceLevel: {
            type: String,
            enum: ["none", "mild", "medium", "hot", "extra_hot"],
            default: "none",
        },
        dietaryTags: {
            type: [String],
            default: [],
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 4.5,
        },
        stockStatus: {
            type: String,
            enum: ["in_stock", "low_stock", "out_of_stock"],
            default: "in_stock",
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
