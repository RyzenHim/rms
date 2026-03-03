const mongoose = require("mongoose");
const Restaurant = require("../models/restaurant.model");

const DEFAULT_SLUG = process.env.DEFAULT_RESTAURANT_SLUG || "default-restaurant";
const DEFAULT_NAME = process.env.DEFAULT_RESTAURANT_NAME || "Default Restaurant";

const ensureDefaultRestaurant = async () => {
    let restaurant = await Restaurant.findOne({ isDefault: true, isActive: true });
    if (restaurant) return restaurant;

    restaurant = await Restaurant.findOne({ slug: DEFAULT_SLUG, isActive: true });
    if (restaurant) {
        if (!restaurant.isDefault) {
            restaurant.isDefault = true;
            await restaurant.save();
        }
        return restaurant;
    }

    try {
        return await Restaurant.create({
            name: DEFAULT_NAME,
            slug: DEFAULT_SLUG,
            isDefault: true,
            isActive: true,
        });
    } catch (error) {
        // Handle parallel create attempts across instances/requests.
        if (error && error.code === 11000) {
            return Restaurant.findOne({ slug: DEFAULT_SLUG, isActive: true });
        }
        throw error;
    }
};

exports.restaurantContext = async (req, res, next) => {
    try {
        const headerRestaurantId = String(req.headers["x-restaurant-id"] || "").trim();
        const headerRestaurantSlug = String(req.headers["x-restaurant-slug"] || "")
            .trim()
            .toLowerCase();

        let restaurant = null;

        if (headerRestaurantId) {
            if (!mongoose.Types.ObjectId.isValid(headerRestaurantId)) {
                return res.status(400).json({ message: "Invalid x-restaurant-id header" });
            }

            restaurant = await Restaurant.findOne({
                _id: headerRestaurantId,
                isActive: true,
            });
        } else if (headerRestaurantSlug) {
            restaurant = await Restaurant.findOne({
                slug: headerRestaurantSlug,
                isActive: true,
            });
        } else {
            restaurant = await ensureDefaultRestaurant();
        }

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant context not found" });
        }

        req.restaurant = restaurant;
        next();
    } catch (error) {
        console.error("RESTAURANT CONTEXT ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
