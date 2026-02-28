const FoodCategory = require("../models/foodCategory.model");
const MenuItem = require("../models/menuItem.model");

const seedDefaults = async () => {
    const categoryCount = await FoodCategory.countDocuments();
    if (categoryCount > 0) return;

    const categories = await FoodCategory.insertMany([
        {
            name: "Burgers & Fries",
            slug: "burgers-fries",
            description: "Juicy burgers with crispy fries",
            image:
                "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
        },
        {
            name: "Pizza",
            slug: "pizza",
            description: "Hand-tossed artisan pizzas",
            image:
                "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80",
        },
        {
            name: "Salads",
            slug: "salads",
            description: "Farm-fresh healthy bowls",
            image:
                "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
        },
    ]);

    await MenuItem.insertMany([
        {
            name: "Signature Chicken Burger",
            slug: "signature-chicken-burger",
            description: "Crispy chicken, lettuce, tomato, and house aioli in a brioche bun.",
            shortDescription: "House special crispy chicken burger",
            category: categories[0]._id,
            image:
                "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
            price: 9.99,
            compareAtPrice: 12.99,
            calories: 640,
            prepTimeMinutes: 18,
            spiceLevel: "mild",
            rating: 4.8,
            isFeatured: true,
        },
        {
            name: "Spicy BBQ Pizza",
            slug: "spicy-bbq-pizza",
            description: "Wood-fired pizza with smoky BBQ sauce, chicken, and jalapenos.",
            shortDescription: "Smoky BBQ pizza with spicy kick",
            category: categories[1]._id,
            image:
                "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
            price: 17.99,
            compareAtPrice: 20.99,
            calories: 980,
            prepTimeMinutes: 30,
            spiceLevel: "medium",
            rating: 4.7,
            isFeatured: true,
        },
        {
            name: "Fresh Garden Salad",
            slug: "fresh-garden-salad",
            description: "Lettuce, cherry tomato, olives, cucumber, and citrus dressing.",
            shortDescription: "Light and refreshing seasonal salad",
            category: categories[2]._id,
            image:
                "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
            price: 8.5,
            compareAtPrice: 10.0,
            calories: 320,
            prepTimeMinutes: 12,
            spiceLevel: "none",
            rating: 4.6,
            isFeatured: true,
        },
    ]);
};

exports.getPublicMenu = async (req, res) => {
    try {
        await seedDefaults();

        const categories = await FoodCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
        const items = await MenuItem.find({ isActive: true })
            .populate("category", "name slug")
            .sort({ isFeatured: -1, createdAt: -1 });

        return res.status(200).json({ categories, items });
    } catch (error) {
        console.error("GET PUBLIC MENU ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const category = await FoodCategory.create(req.body);
        return res.status(201).json({ message: "Category created", category });
    } catch (error) {
        console.error("CREATE CATEGORY ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.createMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.create(req.body);
        const populated = await MenuItem.findById(menuItem._id).populate("category", "name slug");
        return res.status(201).json({ message: "Menu item created", item: populated });
    } catch (error) {
        console.error("CREATE MENU ITEM ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
