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
        subCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuSubCategory",
            default: null,
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
        foodType: {
            type: String,
            enum: ["veg", "non_veg"],
            default: "non_veg",
        },
        course: {
            type: String,
            enum: ["starter", "main", "beverage", "dessert"],
            default: "main",
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
        discountLabel: {
            type: String,
            default: "",
            trim: true,
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
        suitablePartyTypes: {
            type: [String],
            default: [],
        },
        planningPortionFactor: {
            type: Number,
            min: 0.1,
            max: 5,
            default: 1,
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
        portions: {
            type: [
                {
                    label: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    quantityText: {
                        type: String,
                        default: "",
                        trim: true,
                    },
                    price: {
                        type: Number,
                        required: true,
                        min: 0,
                    },
                },
            ],
            default: [],
        },
        recipeIngredients: {
            type: [
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
                    notes: {
                        type: String,
                        default: "",
                        trim: true,
                    },
                },
            ],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
