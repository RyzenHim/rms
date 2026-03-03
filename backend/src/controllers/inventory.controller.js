const Inventory = require("../models/inventory.model");

// Create inventory item
exports.createInventory = async (req, res) => {
  try {
    const { name, description, category, unit, currentStock, minimumThreshold, maximumStock, unitCost, supplier, location } = req.body;

    const inventory = await Inventory.create({
      name,
      description,
      category,
      unit,
      currentStock,
      minimumThreshold,
      maximumStock,
      unitCost,
      supplier,
      location,
    });

    res.status(201).json({ message: "Inventory item created", item: inventory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all inventory
exports.getInventory = async (req, res) => {
  try {
    const { category, status = "all", sortBy = "name" } = req.query;

    let query = { isActive: true };

    if (category) query.category = category;
    if (status === "low") query.$expr = { $lt: ["$currentStock", "$minimumThreshold"] };
    if (status === "full") query.$expr = { $gte: ["$currentStock", "$maximumStock"] };

    let sortOption = { name: 1 };
    if (sortBy === "stock-low") sortOption = { currentStock: 1 };
    if (sortBy === "stock-high") sortOption = { currentStock: -1 };
    if (sortBy === "recent") sortOption = { updatedAt: -1 };

    const items = await Inventory.find(query).sort(sortOption);

    // Calculate summary stats
    const lowStockItems = await Inventory.find({
      isActive: true,
      $expr: { $lt: ["$currentStock", "$minimumThreshold"] },
    }).countDocuments();

    const totalValue = await Inventory.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$currentStock", "$unitCost"] } } } },
    ]);

    res.status(200).json({
      items,
      stats: {
        totalItems: items.length,
        lowStockItems,
        totalValue: totalValue.length > 0 ? totalValue[0].total : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single inventory item
exports.getInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.status(200).json({ item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update inventory item
exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const item = await Inventory.findByIdAndUpdate(id, updates, { new: true });
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.status(200).json({ message: "Inventory updated", item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update stock (add/subtract)
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, type } = req.body; // type: 'add' or 'subtract'

    if (!quantity || !type) {
      return res.status(400).json({ message: "Quantity and type are required" });
    }

    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    let newStock = item.currentStock;
    if (type === "add") newStock += quantity;
    if (type === "subtract") newStock -= quantity;

    if (newStock < 0) {
      return res.status(400).json({ message: "Stock cannot be negative" });
    }

    item.currentStock = newStock;
    if (type === "add") item.lastRestocked = new Date();

    await item.save();

    res.status(200).json({ message: "Stock updated", item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get low stock items
exports.getLowStockItems = async (req, res) => {
  try {
    const items = await Inventory.find({
      isActive: true,
      $expr: { $lt: ["$currentStock", "$minimumThreshold"] },
    }).sort({ currentStock: 1 });

    res.status(200).json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete inventory item (soft delete)
exports.deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Inventory.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.status(200).json({ message: "Inventory item deleted", item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get inventory categories
exports.getCategories = async (req, res) => {
  try {
    const categories = ["vegetables", "grains", "proteins", "dairy", "spices", "oils", "condiments", "beverages", "other"];
    res.status(200).json({ categories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
