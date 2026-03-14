const fs = require("fs");
const path = require("path");
const FoodCategory = require("../models/foodCategory.model");
const MenuSubCategory = require("../models/menuSubCategory.model");
const MenuItem = require("../models/menuItem.model");
const Review = require("../models/review.model");

const MENU_PDF_NAME = "eaf70e15-12ba-4f67-bee9-93384bd96a64.pdf";
const MENU_PDF_PATH = path.join(__dirname, "..", "assets", MENU_PDF_NAME);

const createSlug = (value = "") =>
    String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

const ensureUniqueSlug = async (Model, baseSlug, excludeId = null) => {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await Model.findOne({
            slug,
            ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        }).select("_id");

        if (!existing) return slug;
        slug = `${baseSlug}-${counter++}`;
    }
};

const parseNullableNumber = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const parseNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizePortions = (portions) => {
    if (!Array.isArray(portions)) return [];
    return portions
        .map((portion) => ({
            label: String(portion?.label || "").trim(),
            quantityText: String(portion?.quantityText || "").trim(),
            price: parseNumber(portion?.price, NaN),
        }))
        .filter((portion) => portion.label && Number.isFinite(portion.price) && portion.price >= 0);
};

const normalizeCategoryPayload = (payload = {}) => ({
    name: String(payload.name || "").trim(),
    description: String(payload.description || "").trim(),
    image: String(payload.image || "").trim(),
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
    sortOrder: parseNumber(payload.sortOrder, 0),
});

const normalizeSubCategoryPayload = (payload = {}) => ({
    name: String(payload.name || "").trim(),
    category: payload.category || null,
    heading: String(payload.heading || "").trim(),
    subHeading: String(payload.subHeading || "").trim(),
    description: String(payload.description || "").trim(),
    image: String(payload.image || "").trim(),
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
    sortOrder: parseNumber(payload.sortOrder, 0),
});

const normalizeMenuItemPayload = (payload = {}) => ({
    name: String(payload.name || "").trim(),
    description: String(payload.description || "").trim(),
    shortDescription: String(payload.shortDescription || "").trim(),
    heading: String(payload.heading || "").trim(),
    subHeading: String(payload.subHeading || "").trim(),
    foodType: payload.foodType === "veg" ? "veg" : "non_veg",
    category: payload.category,
    subCategory: payload.subCategory || null,
    image: String(payload.image || "").trim(),
    price: parseNumber(payload.price, NaN),
    compareAtPrice: parseNullableNumber(payload.compareAtPrice),
    discountLabel: String(payload.discountLabel || "").trim(),
    calories: parseNumber(payload.calories, 0),
    prepTimeMinutes: parseNumber(payload.prepTimeMinutes, 20),
    spiceLevel: payload.spiceLevel || "none",
    dietaryTags: Array.isArray(payload.dietaryTags)
        ? payload.dietaryTags.map((tag) => String(tag).trim()).filter(Boolean)
        : [],
    rating: parseNumber(payload.rating, 4.5),
    stockStatus: payload.stockStatus || "in_stock",
    isFeatured: Boolean(payload.isFeatured),
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
    portions: normalizePortions(payload.portions),
});

const getMenuPdfMeta = (req) => {
    const exists = fs.existsSync(MENU_PDF_PATH);
    if (!exists) return null;

    const stats = fs.statSync(MENU_PDF_PATH);
    return {
        name: MENU_PDF_NAME,
        sizeBytes: stats.size,
        updatedAt: stats.mtime,
        url: `${req.protocol}://${req.get("host")}/assets/${MENU_PDF_NAME}`,
    };
};

const ensureAssetsDir = () => {
    const dir = path.dirname(MENU_PDF_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const seedDefaults = async () => {
    const categoryCount = await FoodCategory.countDocuments();
    if (categoryCount > 0) return;

    const categories = await FoodCategory.insertMany([
        {
            name: "Fried Chicken",
            slug: "fried-chicken",
            description: "Crunchy and juicy chicken specials",
            image:
                "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=800&q=80",
            sortOrder: 1,
        },
        {
            name: "Beverages",
            slug: "beverages",
            description: "Cold and hot drinks",
            image:
                "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80",
            sortOrder: 2,
        },
        {
            name: "Snacks",
            slug: "snacks",
            description: "Quick bites and starters",
            image:
                "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
            sortOrder: 3,
        },
    ]);

    const subCategories = await MenuSubCategory.insertMany([
        {
            name: "Spicy Crispy Legs (Bucket)",
            slug: "spicy-crispy-legs-bucket",
            category: categories[0]._id,
            heading: "Fried Chicken",
            subHeading: "Bucket Specials",
            description: "Value bucket combos with spicy crispy legs",
            sortOrder: 1,
        },
        {
            name: "Classic Fried Chicken",
            slug: "classic-fried-chicken",
            category: categories[0]._id,
            heading: "Fried Chicken",
            subHeading: "Classic Crunch",
            description: "Signature crispy fried chicken pieces",
            sortOrder: 2,
        },
        {
            name: "Cold Drinks",
            slug: "cold-drinks",
            category: categories[1]._id,
            heading: "Beverages",
            subHeading: "Refreshment",
            description: "Cool and energizing beverages",
            sortOrder: 1,
        },
    ]);

    await MenuItem.insertMany([
        {
            name: "Spicy Crispy Legs Bucket",
            slug: "spicy-crispy-legs-bucket",
            heading: "Fried Chicken",
            subHeading: "Spicy Crispy Legs (Bucket)",
            description: "Crispy seasoned chicken legs served in bucket options.",
            shortDescription: "Hot crispy legs in value buckets",
            category: categories[0]._id,
            subCategory: subCategories[0]._id,
            image:
                "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=1000&q=80",
            price: 169,
            compareAtPrice: 189,
            discountLabel: "Popular",
            prepTimeMinutes: 18,
            spiceLevel: "medium",
            rating: 4.7,
            isFeatured: true,
            foodType: "non_veg",
            portions: [
                { label: "2 pcs", quantityText: "2 pieces", price: 169 },
                { label: "4 pcs", quantityText: "4 pieces", price: 319 },
                { label: "8 pcs", quantityText: "8 pieces", price: 599 },
            ],
        },
        {
            name: "Classic Crispy Chicken",
            slug: "classic-crispy-chicken",
            heading: "Fried Chicken",
            subHeading: "Classic Fried Chicken",
            description: "Golden fried chicken with signature crunch.",
            shortDescription: "Crispy chicken favorite",
            category: categories[0]._id,
            subCategory: subCategories[1]._id,
            image:
                "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=1000&q=80",
            price: 149,
            compareAtPrice: 169,
            discountLabel: "Weekend Deal",
            prepTimeMinutes: 16,
            spiceLevel: "mild",
            rating: 4.6,
            isFeatured: true,
            foodType: "non_veg",
            portions: [
                { label: "2 pcs", quantityText: "2 pieces", price: 149 },
                { label: "5 pcs", quantityText: "Family mini bucket", price: 349 },
            ],
        },
        {
            name: "Cold Coffee Blast",
            slug: "cold-coffee-blast",
            heading: "Beverages",
            subHeading: "Cold Drinks",
            description: "Chilled coffee, cream and crushed ice.",
            shortDescription: "Creamy chilled coffee",
            category: categories[1]._id,
            subCategory: subCategories[2]._id,
            image:
                "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1000&q=80",
            price: 99,
            compareAtPrice: 119,
            discountLabel: "18% OFF",
            prepTimeMinutes: 8,
            rating: 4.7,
            isFeatured: true,
            foodType: "veg",
            portions: [{ label: "Regular", quantityText: "300 ml", price: 99 }],
        },
        {
            name: "Paneer Popcorn",
            slug: "paneer-popcorn",
            heading: "Snacks",
            subHeading: "Crispy Veg Bites",
            description: "Crunchy paneer popcorn served with mint mayo.",
            shortDescription: "Veg crispy bite snack",
            category: categories[2]._id,
            image:
                "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1000&q=80",
            price: 129,
            compareAtPrice: 149,
            discountLabel: "Veg Favorite",
            prepTimeMinutes: 14,
            spiceLevel: "mild",
            rating: 4.5,
            isFeatured: true,
            foodType: "veg",
            portions: [{ label: "8 pcs", quantityText: "8 pieces", price: 129 }],
        },
    ]);
};

const validateCategoryAndSubCategory = async (categoryId, subCategoryId) => {
    if (!categoryId) return { ok: false, message: "Category is required" };

    const categoryExists = await FoodCategory.exists({ _id: categoryId });
    if (!categoryExists) return { ok: false, message: "Category does not exist" };

    if (!subCategoryId) return { ok: true };

    const subCategory = await MenuSubCategory.findOne({ _id: subCategoryId, category: categoryId }).select("_id");
    if (!subCategory) return { ok: false, message: "Sub-category does not belong to selected category" };

    return { ok: true };
};

const attachReviewStats = async (items) => {
    const itemIds = items.map((item) => item._id);
    if (!itemIds.length) return items;

    const reviewStats = await Review.aggregate([
        {
            $match: {
                menuItem: { $in: itemIds },
                status: "approved",
            },
        },
        {
            $group: {
                _id: "$menuItem",
                averageRating: { $avg: "$rating" },
                reviewCount: { $sum: 1 },
            },
        },
    ]);

    const statsMap = new Map(
        reviewStats.map((entry) => [
            String(entry._id),
            {
                averageRating: Number(entry.averageRating || 0),
                reviewCount: Number(entry.reviewCount || 0),
            },
        ]),
    );

    return items.map((item) => {
        const stats = statsMap.get(String(item._id));
        const objectItem = item.toObject ? item.toObject() : item;
        return {
            ...objectItem,
            averageRating: stats ? Number(stats.averageRating.toFixed(1)) : Number(objectItem.rating || 0),
            reviewCount: stats ? stats.reviewCount : 0,
        };
    });
};

exports.getPublicMenu = async (req, res) => {
    try {
        await seedDefaults();

        const categories = await FoodCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
        const subCategories = await MenuSubCategory.find({ isActive: true })
            .populate("category", "name slug")
            .sort({ sortOrder: 1, name: 1 });
        const items = await MenuItem.find({ isActive: true })
            .populate("category", "name slug")
            .populate("subCategory", "name slug heading subHeading")
            .sort({ isFeatured: -1, createdAt: -1 });
        const itemsWithStats = await attachReviewStats(items);

        return res.status(200).json({
            categories,
            subCategories,
            items: itemsWithStats,
            menuPdf: getMenuPdfMeta(req),
        });
    } catch (error) {
        console.error("GET PUBLIC MENU ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.getAdminMenuData = async (req, res) => {
    try {
        const categories = await FoodCategory.find().sort({ sortOrder: 1, name: 1 });
        const subCategories = await MenuSubCategory.find()
            .populate("category", "name slug")
            .sort({ sortOrder: 1, name: 1 });
        const items = await MenuItem.find()
            .populate("category", "name slug")
            .populate("subCategory", "name slug heading subHeading")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            categories,
            subCategories,
            items,
            menuPdf: getMenuPdfMeta(req),
        });
    } catch (error) {
        console.error("GET ADMIN MENU DATA ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateMenuPdf = async (req, res) => {
    try {
        const { base64 } = req.body;
        if (!base64 || typeof base64 !== "string") {
            return res.status(400).json({ message: "base64 PDF data is required" });
        }

        const cleaned = base64.includes(",") ? base64.split(",")[1] : base64;
        const buffer = Buffer.from(cleaned, "base64");
        const signature = buffer.subarray(0, 4).toString("utf8");

        if (signature !== "%PDF") {
            return res.status(400).json({ message: "Uploaded file is not a valid PDF" });
        }

        ensureAssetsDir();
        fs.writeFileSync(MENU_PDF_PATH, buffer);

        return res.status(200).json({
            message: "Menu PDF updated",
            menuPdf: getMenuPdfMeta(req),
        });
    } catch (error) {
        console.error("UPDATE MENU PDF ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const payload = normalizeCategoryPayload(req.body);
        if (!payload.name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const baseSlug = createSlug(req.body.slug || payload.name);
        if (!baseSlug) {
            return res.status(400).json({ message: "Valid category name or slug is required" });
        }

        payload.slug = await ensureUniqueSlug(FoodCategory, baseSlug);
        const category = await FoodCategory.create(payload);

        return res.status(201).json({ message: "Category created", category });
    } catch (error) {
        console.error("CREATE CATEGORY ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await FoodCategory.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "Category not found" });
        }

        const payload = normalizeCategoryPayload(req.body);
        if (!payload.name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const baseSlug = createSlug(req.body.slug || payload.name);
        if (!baseSlug) {
            return res.status(400).json({ message: "Valid category name or slug is required" });
        }

        payload.slug = await ensureUniqueSlug(FoodCategory, baseSlug, id);
        Object.assign(existing, payload);
        await existing.save();

        return res.status(200).json({ message: "Category updated", category: existing });
    } catch (error) {
        console.error("UPDATE CATEGORY ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await FoodCategory.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "Category not found" });
        }

        const linkedSubCategories = await MenuSubCategory.countDocuments({ category: id });
        const linkedItems = await MenuItem.countDocuments({ category: id });
        if (linkedSubCategories > 0 || linkedItems > 0) {
            return res.status(400).json({
                message: "Delete linked sub-categories and menu items before deleting this category",
            });
        }

        await existing.deleteOne();
        return res.status(200).json({ message: "Category deleted" });
    } catch (error) {
        console.error("DELETE CATEGORY ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.createSubCategory = async (req, res) => {
    try {
        const payload = normalizeSubCategoryPayload(req.body);
        if (!payload.name || !payload.category) {
            return res.status(400).json({ message: "Sub-category name and category are required" });
        }

        const categoryExists = await FoodCategory.exists({ _id: payload.category });
        if (!categoryExists) {
            return res.status(400).json({ message: "Category does not exist" });
        }

        const baseSlug = createSlug(req.body.slug || payload.name);
        if (!baseSlug) {
            return res.status(400).json({ message: "Valid sub-category name or slug is required" });
        }

        payload.slug = await ensureUniqueSlug(MenuSubCategory, baseSlug);
        const subCategory = await MenuSubCategory.create(payload);
        const populated = await MenuSubCategory.findById(subCategory._id).populate("category", "name slug");

        return res.status(201).json({ message: "Sub-category created", subCategory: populated });
    } catch (error) {
        console.error("CREATE SUB-CATEGORY ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await MenuSubCategory.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "Sub-category not found" });
        }

        const payload = normalizeSubCategoryPayload(req.body);
        if (!payload.name || !payload.category) {
            return res.status(400).json({ message: "Sub-category name and category are required" });
        }

        const categoryExists = await FoodCategory.exists({ _id: payload.category });
        if (!categoryExists) {
            return res.status(400).json({ message: "Category does not exist" });
        }

        const baseSlug = createSlug(req.body.slug || payload.name);
        if (!baseSlug) {
            return res.status(400).json({ message: "Valid sub-category name or slug is required" });
        }

        payload.slug = await ensureUniqueSlug(MenuSubCategory, baseSlug, id);
        Object.assign(existing, payload);
        await existing.save();

        const populated = await MenuSubCategory.findById(id).populate("category", "name slug");
        return res.status(200).json({ message: "Sub-category updated", subCategory: populated });
    } catch (error) {
        console.error("UPDATE SUB-CATEGORY ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.deleteSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await MenuSubCategory.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "Sub-category not found" });
        }

        const linkedItems = await MenuItem.countDocuments({ subCategory: id });
        if (linkedItems > 0) {
            return res.status(400).json({
                message: "Delete linked menu items before deleting this sub-category",
            });
        }

        await existing.deleteOne();
        return res.status(200).json({ message: "Sub-category deleted" });
    } catch (error) {
        console.error("DELETE SUB-CATEGORY ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.createMenuItem = async (req, res) => {
    try {
        const payload = normalizeMenuItemPayload(req.body);

        if (!payload.name || !payload.description || !payload.category) {
            return res.status(400).json({
                message: "Name, description and category are required",
            });
        }

        if (!Number.isFinite(payload.price) || payload.price < 0) {
            return res.status(400).json({ message: "Valid price is required" });
        }

        const categoryValidation = await validateCategoryAndSubCategory(payload.category, payload.subCategory);
        if (!categoryValidation.ok) {
            return res.status(400).json({ message: categoryValidation.message });
        }

        const baseSlug = createSlug(req.body.slug || payload.name);
        if (!baseSlug) {
            return res.status(400).json({ message: "Valid menu item name or slug is required" });
        }

        payload.slug = await ensureUniqueSlug(MenuItem, baseSlug);
        const menuItem = await MenuItem.create(payload);
        const populated = await MenuItem.findById(menuItem._id)
            .populate("category", "name slug")
            .populate("subCategory", "name slug heading subHeading");

        return res.status(201).json({ message: "Menu item created", item: populated });
    } catch (error) {
        console.error("CREATE MENU ITEM ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await MenuItem.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "Menu item not found" });
        }

        const payload = normalizeMenuItemPayload(req.body);

        if (!payload.name || !payload.description || !payload.category) {
            return res.status(400).json({
                message: "Name, description and category are required",
            });
        }

        if (!Number.isFinite(payload.price) || payload.price < 0) {
            return res.status(400).json({ message: "Valid price is required" });
        }

        const categoryValidation = await validateCategoryAndSubCategory(payload.category, payload.subCategory);
        if (!categoryValidation.ok) {
            return res.status(400).json({ message: categoryValidation.message });
        }

        const baseSlug = createSlug(req.body.slug || payload.name);
        if (!baseSlug) {
            return res.status(400).json({ message: "Valid menu item name or slug is required" });
        }

        payload.slug = await ensureUniqueSlug(MenuItem, baseSlug, id);
        Object.assign(existing, payload);
        await existing.save();

        const populated = await MenuItem.findById(existing._id)
            .populate("category", "name slug")
            .populate("subCategory", "name slug heading subHeading");

        return res.status(200).json({ message: "Menu item updated", item: populated });
    } catch (error) {
        console.error("UPDATE MENU ITEM ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await MenuItem.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "Menu item not found" });
        }

        await existing.deleteOne();
        return res.status(200).json({ message: "Menu item deleted" });
    } catch (error) {
        console.error("DELETE MENU ITEM ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
