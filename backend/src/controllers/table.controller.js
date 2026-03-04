const Table = require("../models/table.model");

// Get all tables
exports.getAllTables = async (req, res) => {
  try {
    const { status, capacity } = req.query;

    let query = { isActive: true };

    if (status) query.status = status;
    if (capacity) query.capacity = { $gte: parseInt(capacity) };

    const tables = await Table.find(query).sort({ tableNumber: 1 });

    res.status(200).json({ tables });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single table
exports.getTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    res.status(200).json({ table });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create table (admin only)
exports.createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, location, shape, description } = req.body;

    if (!tableNumber || !capacity) {
      return res.status(400).json({ message: "Table number and capacity are required" });
    }

    const table = await Table.create({
      tableNumber,
      capacity,
      location,
      shape,
      description,
    });

    res.status(201).json({ message: "Table created successfully", table });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Table number already exists" });
    }
    res.status(500).json({ message: err.message });
  }
};

// Update table
exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const table = await Table.findByIdAndUpdate(id, updates, { new: true });
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    res.status(200).json({ message: "Table updated successfully", table });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update table status
exports.updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["available", "reserved", "occupied", "maintenance"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const table = await Table.findByIdAndUpdate(id, { status }, { new: true });
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    res.status(200).json({ message: "Status updated", table });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete table (soft delete)
exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await Table.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    res.status(200).json({ message: "Table deleted", table });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get available tables for a given date/time and guest count
exports.getAvailableTables = async (req, res) => {
  try {
    const { date, time, guests } = req.query;

    if (!date || !time || !guests) {
      return res.status(400).json({ message: "Date, time, and guest count are required" });
    }

    const Reservation = require("../models/reservation.model");

    // Find tables with enough capacity
    const tables = await Table.find({
      isActive: true,
      status: "available",
      capacity: { $gte: parseInt(guests) },
    }).sort({ capacity: 1 });

    // Filter out reserved tables for this time slot
    const reservedTableIds = await Reservation.find(
      {
        reservationDate: {
          $gte: new Date(date),
          $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
        },
        status: { $in: ["confirmed", "arrived"] },
      },
      "table"
    );

    const reservedIds = reservedTableIds.map((r) => r.table.toString());

    const availableTables = tables.filter((t) => !reservedIds.includes(t._id.toString()));

    res.status(200).json({ availableTables, totalTables: tables.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get table statistics
exports.getTableStats = async (req, res) => {
  try {
    const stats = {
      totalTables: await Table.countDocuments({ isActive: true }),
      available: await Table.countDocuments({ isActive: true, status: "available" }),
      reserved: await Table.countDocuments({ isActive: true, status: "reserved" }),
      occupied: await Table.countDocuments({ isActive: true, status: "occupied" }),
      maintenance: await Table.countDocuments({ isActive: true, status: "maintenance" }),
    };

    res.status(200).json({ stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
