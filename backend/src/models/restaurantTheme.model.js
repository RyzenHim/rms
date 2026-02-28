const mongoose = require("mongoose");

const restaurantThemeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            default: "Emerald Bistro",
        },
        heroTitle: {
            type: String,
            required: true,
            default: "Delicious food at your doorstep",
        },
        heroSubtitle: {
            type: String,
            required: true,
            default: "Freshly crafted meals, fast delivery, and unforgettable taste.",
        },
        primaryColor: {
            type: String,
            default: "#0b6b49",
        },
        secondaryColor: {
            type: String,
            default: "#ffd54f",
        },
        accentColor: {
            type: String,
            default: "#1f2937",
        },
        surfaceColor: {
            type: String,
            default: "#f8faf8",
        },
        logoText: {
            type: String,
            default: "DelishDrop",
        },
        ctaText: {
            type: String,
            default: "Order Now",
        },
        heroImage: {
            type: String,
            default:
                "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80",
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

module.exports = mongoose.model("RestaurantTheme", restaurantThemeSchema);
