const Inventory = require("../models/inventory.model");
const InventoryCategory = require("../models/inventoryCategory.model");
const InventoryUnit = require("../models/inventoryUnit.model");
const { defaultInventoryCategories, defaultInventoryUnits } = require("../constants/inventoryMetadata");
const { executeWithRetry } = require("../utils/transactionManager");

const normalizeValue = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const serializeCategory = (category) => ({
  _id: category._id,
  name: category.name,
  description: category.description || "",
  sortOrder: category.sortOrder || 0,
  isActive: Boolean(category.isActive),
});

const serializeUnit = (unit) => ({
  _id: unit._id,
  name: unit.name,
  code: unit.code,
  sortOrder: unit.sortOrder || 0,
  isActive: Boolean(unit.isActive),
});

const ensureInventoryMetadata = async () => {
  const [categoryCount, unitCount] = await Promise.all([
    InventoryCategory.countDocuments(),
    InventoryUnit.countDocuments(),
  ]);

  if (categoryCount === 0) {
    await InventoryCategory.insertMany(
      defaultInventoryCategories.map((category) => ({
        ...category,
        normalizedName: normalizeValue(category.name),
      }))
    );
  }

  if (unitCount === 0) {
    await InventoryUnit.insertMany(
      defaultInventoryUnits.map((unit) => ({
        ...unit,
        normalizedCode: normalizeValue(unit.code),
      }))
    );
  }
};

const getActiveMetadata = async () => {
  await ensureInventoryMetadata();

  const [categories, units] = await Promise.all([
    InventoryCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }),
    InventoryUnit.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }),
  ]);

  return {
    categories: categories.map(serializeCategory),
    units: units.map(serializeUnit),
  };
};

const validateCategoryAndUnit = async ({ category, unit }) => {
  const normalizedCategory = normalizeValue(category);
  const normalizedUnit = normalizeValue(unit);

  const [categoryDoc, unitDoc] = await Promise.all([
    InventoryCategory.findOne({ normalizedName: normalizedCategory, isActive: true }),
    InventoryUnit.findOne({ normalizedCode: normalizedUnit, isActive: true }),
  ]);

  if (!categoryDoc) {
    return { error: "Please select a valid inventory category" };
  }

  if (!unitDoc) {
    return { error: "Please select a valid inventory unit" };
  }

  return {
    category: categoryDoc.name,
    unit: unitDoc.code,
  };
};

const buildInventoryQuery = ({ category, status = "all", sortBy = "name" }) => {
  const query = { isActive: true };

  if (category) {
    query.category = category;
  }

  if (status === "low") {
    query.$expr = { $lt: ["$currentStock", "$minimumThreshold"] };
  }

  if (status === "full") {
    query.$expr = { $gte: ["$currentStock", "$maximumStock"] };
  }

  let sortOption = { name: 1 };
  if (sortBy === "stock-low") sortOption = { currentStock: 1 };
  if (sortBy === "stock-high") sortOption = { currentStock: -1 };
  if (sortBy === "recent") sortOption = { updatedAt: -1 };

  return { query, sortOption };
};

exports.createInventory = async (req, res) => {
  try {
    const { name, description, category, unit, currentStock, minimumThreshold, maximumStock, unitCost, supplier, location } = req.body;

    const validated = await validateCategoryAndUnit({ category, unit });
    if (validated.error) {
      return res.status(400).json({ message: validated.error });
    }

    const inventory = await Inventory.create({
      name,
      description,
      category: validated.category,
      unit: validated.unit,
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

exports.getInventory = async (req, res) => {
  try {
    const { query, sortOption } = buildInventoryQuery(req.query);

    const [items, lowStockItems, totalValue, metadata] = await Promise.all([
      Inventory.find(query).sort(sortOption),
      Inventory.countDocuments({
        isActive: true,
        $expr: { $lt: ["$currentStock", "$minimumThreshold"] },
      }),
      Inventory.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: { $multiply: ["$currentStock", "$unitCost"] } } } },
      ]),
      getActiveMetadata(),
    ]);

    res.status(200).json({
      items,
      stats: {
        totalItems: items.length,
        lowStockItems,
        totalValue: totalValue.length > 0 ? totalValue[0].total : 0,
      },
      metadata,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.category || updates.unit) {
      const existingItem = await Inventory.findById(id);
      if (!existingItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }

      const validated = await validateCategoryAndUnit({
        category: updates.category || existingItem.category,
        unit: updates.unit || existingItem.unit,
      });

      if (validated.error) {
        return res.status(400).json({ message: validated.error });
      }

      updates.category = validated.category;
      updates.unit = validated.unit;
    }

    const item = await Inventory.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.status(200).json({ message: "Inventory updated", item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, type } = req.body;

    if (!quantity || !type) {
      return res.status(400).json({ message: "Quantity and type are required" });
    }

    const updatedItem = await executeWithRetry(
      async (session) => {
        const item = await Inventory.findById(id).session(session);
        if (!item) {
          throw new Error("Inventory item not found");
        }

        let newStock = item.currentStock;
        if (type === "add") newStock += quantity;
        if (type === "subtract") newStock -= quantity;

        if (newStock < 0) {
          throw new Error("Stock cannot be negative");
        }

        item.currentStock = newStock;
        if (type === "add") item.lastRestocked = new Date();

        await item.save({ session });
        return item;
      },
      3,
      100
    );

    res.status(200).json({ message: "Stock updated", item: updatedItem });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

exports.getMetadata = async (req, res) => {
  try {
    const metadata = await getActiveMetadata();
    res.status(200).json(metadata);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const normalizedName = normalizeValue(name);
    const existing = await InventoryCategory.findOne({ normalizedName });

    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await InventoryCategory.create({
      name,
      normalizedName,
      description: req.body.description || "",
      sortOrder: Number(req.body.sortOrder || 0),
      isActive: req.body.isActive !== false,
    });

    res.status(201).json({ message: "Category created", category: serializeCategory(category) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const name = req.body.name?.trim();
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const normalizedName = normalizeValue(name);
    const duplicate = await InventoryCategory.findOne({ normalizedName, _id: { $ne: id } });
    if (duplicate) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await InventoryCategory.findByIdAndUpdate(
      id,
      {
        name,
        normalizedName,
        description: req.body.description || "",
        sortOrder: Number(req.body.sortOrder || 0),
        isActive: req.body.isActive !== false,
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const inventoryItems = await Inventory.find({ category: { $in: [category.name, req.body.previousName].filter(Boolean) } });
    await Promise.all(
      inventoryItems.map((item) => {
        item.category = category.name;
        return item.save();
      })
    );

    res.status(200).json({ message: "Category updated", category: serializeCategory(category) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await InventoryCategory.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const inUse = await Inventory.exists({ category: category.name, isActive: true });
    if (inUse) {
      return res.status(400).json({ message: "Category is still used by inventory items" });
    }

    await category.deleteOne();
    res.status(200).json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createUnit = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const code = req.body.code?.trim();

    if (!name || !code) {
      return res.status(400).json({ message: "Unit name and code are required" });
    }

    const normalizedCode = normalizeValue(code);
    const existing = await InventoryUnit.findOne({ normalizedCode });
    if (existing) {
      return res.status(400).json({ message: "Unit code already exists" });
    }

    const unit = await InventoryUnit.create({
      name,
      code,
      normalizedCode,
      sortOrder: Number(req.body.sortOrder || 0),
      isActive: req.body.isActive !== false,
    });

    res.status(201).json({ message: "Unit created", unit: serializeUnit(unit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const name = req.body.name?.trim();
    const code = req.body.code?.trim();

    if (!name || !code) {
      return res.status(400).json({ message: "Unit name and code are required" });
    }

    const normalizedCode = normalizeValue(code);
    const duplicate = await InventoryUnit.findOne({ normalizedCode, _id: { $ne: id } });
    if (duplicate) {
      return res.status(400).json({ message: "Unit code already exists" });
    }

    const unit = await InventoryUnit.findByIdAndUpdate(
      id,
      {
        name,
        code,
        normalizedCode,
        sortOrder: Number(req.body.sortOrder || 0),
        isActive: req.body.isActive !== false,
      },
      { new: true, runValidators: true }
    );

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const inventoryItems = await Inventory.find({ unit: { $in: [unit.code, req.body.previousCode].filter(Boolean) } });
    await Promise.all(
      inventoryItems.map((item) => {
        item.unit = unit.code;
        return item.save();
      })
    );

    res.status(200).json({ message: "Unit updated", unit: serializeUnit(unit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const unit = await InventoryUnit.findById(id);

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const inUse = await Inventory.exists({ unit: unit.code, isActive: true });
    if (inUse) {
      return res.status(400).json({ message: "Unit is still used by inventory items" });
    }

    await unit.deleteOne();
    res.status(200).json({ message: "Unit deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
