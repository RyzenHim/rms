const Customer = require("../models/customer.model");
const MenuItem = require("../models/menuItem.model");
const Tray = require("../models/tray.model");

const toObjectIdString = (value) => String(value || "");

const normalizeQuantity = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.floor(parsed);
};

const getCustomer = async (req) => Customer.findOne({ user: req.user._id });

const getOrCreateTray = async (customerId) => {
  let tray = await Tray.findOne({ customer: customerId });
  if (!tray) {
    tray = await Tray.create({ customer: customerId, items: [] });
  }
  return tray;
};

const buildValidatedItems = async (rawItems = []) => {
  if (!Array.isArray(rawItems)) {
    const error = new Error("Tray items must be an array");
    error.statusCode = 400;
    throw error;
  }

  const normalized = [];

  for (const rawItem of rawItems) {
    const menuItemId = rawItem?.menuItem || rawItem?.menuItemId;
    const quantity = normalizeQuantity(rawItem?.quantity);
    if (!menuItemId || !quantity) {
      const error = new Error("Each tray item requires a valid menu item and quantity");
      error.statusCode = 400;
      throw error;
    }

    const menuItem = await MenuItem.findOne({
      _id: menuItemId,
      isActive: true,
      stockStatus: { $ne: "out_of_stock" },
    }).select("name price image");

    if (!menuItem) {
      const error = new Error("One or more menu items are unavailable");
      error.statusCode = 400;
      throw error;
    }

    normalized.push({
      menuItem: menuItem._id,
      name: menuItem.name,
      unitPrice: Number(menuItem.price || 0),
      quantity,
      notes: String(rawItem?.notes || "").trim(),
      image: String(menuItem.image || "").trim(),
    });
  }

  return normalized;
};

exports.getTray = async (req, res) => {
  try {
    const customer = await getCustomer(req);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const tray = await getOrCreateTray(customer._id);
    return res.status(200).json({ tray });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

exports.replaceTray = async (req, res) => {
  try {
    const customer = await getCustomer(req);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const items = await buildValidatedItems(req.body?.items || []);
    const tray = await getOrCreateTray(customer._id);
    tray.items = items;
    await tray.save();

    return res.status(200).json({ message: "Tray updated", tray });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Internal server error" });
  }
};

exports.clearTray = async (req, res) => {
  try {
    const customer = await getCustomer(req);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const tray = await getOrCreateTray(customer._id);
    tray.items = [];
    await tray.save();

    return res.status(200).json({ message: "Tray cleared", tray });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

exports.removeTrayItem = async (req, res) => {
  try {
    const customer = await getCustomer(req);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const tray = await getOrCreateTray(customer._id);
    const menuItemId = toObjectIdString(req.params.menuItemId);
    tray.items = tray.items.filter((item) => toObjectIdString(item.menuItem) !== menuItemId);
    await tray.save();

    return res.status(200).json({ message: "Item removed from tray", tray });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};
