const mongoose = require("mongoose");

const restaurantThemeSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            default: "Feane Restaurant",
        },
        heroTitle: {
            type: String,
            required: true,
            default: "Premium Food & Restaurant Experience",
        },
        heroSubtitle: {
            type: String,
            required: true,
            default: "Freshly crafted meals, fast delivery, and unforgettable taste.",
        },
        primaryColor: {
            type: String,
            default: "#ff8c3a",
        },
        secondaryColor: {
            type: String,
            default: "#ffd700",
        },
        accentColor: {
            type: String,
            default: "#292524",
        },
        surfaceColor: {
            type: String,
            default: "#fafaf9",
        },
        logoText: {
            type: String,
            default: "Feane",
        },
        logoImage: {
            type: String,
            default: "",
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
        heroTagline: {
            type: String,
            default: "Premium Food & Restaurant Experience",
        },
        menuHeading: {
            type: String,
            default: "Dynamic Menu",
        },
        menuSubHeading: {
            type: String,
            default: "All sections are controlled from Admin panel.",
        },
        addressLine: {
            type: String,
            default: "123 Food Street, Downtown",
        },
        city: {
            type: String,
            default: "Mumbai",
        },
        state: {
            type: String,
            default: "Maharashtra",
        },
        country: {
            type: String,
            default: "India",
        },
        postalCode: {
            type: String,
            default: "400001",
        },
        contactPhone: {
            type: String,
            default: "+91 99999 99999",
        },
        contactEmail: {
            type: String,
            default: "hello@feane.com",
        },
        mapEmbedUrl: {
            type: String,
            default: "",
        },
        openingHours: {
            type: String,
            default: "Mon-Sun: 11:00 AM - 11:00 PM",
        },
        facebookUrl: {
            type: String,
            default: "",
        },
        instagramUrl: {
            type: String,
            default: "",
        },
        youtubeUrl: {
            type: String,
            default: "",
        },
        twitterUrl: {
            type: String,
            default: "",
        },
        footerNote: {
            type: String,
            default: "Fresh food. Fast service. Great moments.",
        },
        colorMode: {
            type: String,
            enum: ["system", "light", "dark"],
            default: "system",
        },
        allowUserThemeToggle: {
            type: Boolean,
            default: true,
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

restaurantThemeSchema.index({ restaurant: 1, isActive: 1, updatedAt: -1 });

module.exports = mongoose.model("RestaurantTheme", restaurantThemeSchema);
