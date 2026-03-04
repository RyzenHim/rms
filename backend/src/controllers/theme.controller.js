const RestaurantTheme = require("../models/restaurantTheme.model");

exports.getActiveTheme = async (req, res) => {
    try {
        let theme = await RestaurantTheme.findOne({ isActive: true }).sort({ updatedAt: -1 });
        if (!theme) {
            theme = await RestaurantTheme.create({});
        }

        return res.status(200).json({ theme });
    } catch (error) {
        console.error("GET THEME ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.upsertTheme = async (req, res) => {
    try {
        const payload = req.body;
        let theme = await RestaurantTheme.findOne({ isActive: true }).sort({ updatedAt: -1 });

        if (!theme) {
            theme = await RestaurantTheme.create(payload);
        } else {
            Object.assign(theme, payload);
            await theme.save();
        }

        return res.status(200).json({
            message: "Theme updated successfully",
            theme,
        });
    } catch (error) {
        console.error("UPSERT THEME ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
