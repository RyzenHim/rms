const mongoose = require("mongoose");

const menuSubCategorySchema = new mongoose.Schema(
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
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodCategory",
            required: true,
        },
        heading: {
            type: String,
            default: "",
            trim: true,
        },
        subHeading: {
            type: String,
            default: "",
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        image: {
            type: String,
            default: "",
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
    {
        timestamps: true,
    }
);

menuSubCategorySchema.index({ name: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("MenuSubCategory", menuSubCategorySchema);
