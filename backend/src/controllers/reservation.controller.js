const Reservation = require("../models/reservation.model");
const Table = require("../models/table.model");
const Customer = require("../models/customer.model");

const getCustomerFromRequest = async (req) =>
  Customer.findOne({ user: req.user._id }).populate("user");

// Create reservation
exports.createReservation = async (req, res) => {
  try {
    const {
      tableId,
      numberOfGuests,
      reservationDate,
      reservationTime,
      specialRequests,
      occasion,
      customerPhone,
      checkoutTime,
    } = req.body;

    // Validate inputs
    if (!tableId || !numberOfGuests || !reservationDate || !reservationTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Get customer details
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const effectivePhone = String(customer.user.phone || customerPhone || "").trim();
    if (!effectivePhone) {
      return res
        .status(400)
        .json({ message: "Customer phone number is required. Please add it in your profile or enter it while booking." });
    }

    // Check table exists and has capacity
    const table = await Table.findOne({ _id: tableId, isActive: true });
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    // Check table status - only allow reservations on available or reserved tables
    if (table.status === "occupied") {
      return res.status(400).json({ message: "Table is currently occupied. Please select a different table." });
    }
    if (table.status === "maintenance") {
      return res.status(400).json({ message: "Table is under maintenance. Please select a different table." });
    }

    if (table.capacity < numberOfGuests) {
      return res.status(400).json({ message: `Table capacity is ${table.capacity}, but ${numberOfGuests} guests requested` });
    }

    // Build start and checkout times with max 3-hour window
    const startDate = new Date(reservationDate);
    const [sh, sm] = String(reservationTime || "00:00").split(":").map(Number);
    startDate.setHours(sh || 0, sm || 0, 0, 0);

    let endDate = null;
    let duration = 180; // minutes

    if (checkoutTime) {
      endDate = new Date(reservationDate);
      const [eh, em] = String(checkoutTime || "00:00").split(":").map(Number);
      endDate.setHours(eh || 0, em || 0, 0, 0);
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffMinutes = diffMs / (1000 * 60);

      if (diffMs <= 0) {
        return res.status(400).json({ message: "Checkout time must be after reservation time" });
      }
      if (diffMinutes > 180) {
        return res.status(400).json({ message: "Reservation duration cannot exceed 3 hours" });
      }

      duration = Math.round(diffMinutes);
    } else {
      endDate = new Date(startDate.getTime() + duration * 60 * 1000);
    }

    // Check for conflicting reservations on same table and overlapping time window
    const sameDayReservations = await Reservation.find({
      table: tableId,
      reservationDate: {
        $gte: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()),
        $lt: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1),
      },
      status: { $in: ["pending", "confirmed", "arrived"] },
    });

    const overlaps = sameDayReservations.some((existing) => {
      const existingStart = new Date(existing.reservationDate);
      const [eh, em] = String(existing.reservationTime || "00:00").split(":").map(Number);
      existingStart.setHours(eh || 0, em || 0, 0, 0);
      const existingEnd = existing.checkoutTime
        ? new Date(existing.checkoutTime)
        : new Date(existingStart.getTime() + (existing.duration || 180) * 60 * 1000);

      return startDate < existingEnd && endDate > existingStart;
    });

    if (overlaps) {
      return res.status(400).json({ message: "Table is already reserved during the selected time window" });
    }

    // Create reservation
    const reservation = await Reservation.create({
      customer: customer._id,
      customerName: customer.user.name,
      customerPhone: effectivePhone,
      customerEmail: customer.user.email,
      table: tableId,
      numberOfGuests,
      reservationDate: startDate,
      reservationTime,
      duration,
      checkoutTime: endDate,
      specialRequests,
      occasion,
    });

    const populatedReservation = await reservation.populate("table customer");

    // Update table status
    await Table.findByIdAndUpdate(tableId, { status: "reserved" });

    res.status(201).json({ message: "Reservation created successfully", reservation: populatedReservation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get customer's reservations
exports.getMyReservations = async (req, res) => {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const { status } = req.query;

    let query = { customer: customer._id };
    if (status) query.status = status;

    const reservations = await Reservation.find(query)
      .populate("table")
      .sort({ reservationDate: -1 });

    res.status(200).json({ reservations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all reservations (admin)
exports.getAllReservations = async (req, res) => {
  try {
    const { date, status, page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      query.reservationDate = { $gte: startDate, $lt: endDate };
    }

    if (status) query.status = status;

    const reservations = await Reservation.find(query)
      .populate("table customer")
      .sort({ reservationDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Reservation.countDocuments(query);

    res.status(200).json({
      reservations,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single reservation
exports.getReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id).populate("table customer");
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    res.status(200).json({ reservation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update reservation
exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await getCustomerFromRequest(req);
    const updates = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Only allow customer to update their own pending reservations
    if (
      req.user.roles[0] !== "admin" &&
      (!customer ||
        reservation.customer.toString() !== customer._id.toString() ||
        !["pending", "confirmed"].includes(reservation.status))
    ) {
      return res.status(403).json({ message: "You cannot update this reservation" });
    }

    const updatedReservation = await Reservation.findByIdAndUpdate(id, updates, { new: true }).populate("table customer");

    res.status(200).json({ message: "Reservation updated", reservation: updatedReservation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cancel reservation
exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const customer = await getCustomerFromRequest(req);

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Check authorization
    if (
      req.user.roles[0] !== "admin" &&
      (!customer || reservation.customer.toString() !== customer._id.toString())
    ) {
      return res.status(403).json({ message: "You cannot cancel this reservation" });
    }

    if (!["pending", "confirmed"].includes(reservation.status)) {
      return res.status(400).json({ message: "Only pending or confirmed reservations can be cancelled" });
    }

    // Update reservation
    const updated = await Reservation.findByIdAndUpdate(
      id,
      {
        status: "cancelled",
        cancellationReason: reason || "",
      },
      { new: true }
    ).populate("table customer");

    // Free up table
    await Table.findByIdAndUpdate(reservation.table, { status: "available" });

    res.status(200).json({ message: "Reservation cancelled", reservation: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark as check-in (check-in at restaurant)
exports.checkInReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status !== "confirmed") {
      return res.status(400).json({ message: "Only confirmed reservations can be checked in" });
    }

    const updated = await Reservation.findByIdAndUpdate(
      id,
      {
        status: "arrived",
        checkinTime: new Date(),
      },
      { new: true }
    ).populate("table customer");

    // Update table status to occupied
    await Table.findByIdAndUpdate(reservation.table, { status: "occupied" });

    res.status(200).json({ message: "Checked in successfully", reservation: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark as check-out (complete reservation)
exports.checkOutReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status !== "arrived") {
      return res.status(400).json({ message: "Only arrived reservations can be checked out" });
    }

    const updated = await Reservation.findByIdAndUpdate(
      id,
      {
        status: "completed",
        checkoutTime: new Date(),
      },
      { new: true }
    ).populate("table customer");

    // Free up table
    await Table.findByIdAndUpdate(reservation.table, { status: "available" });

    res.status(200).json({ message: "Checked out successfully", reservation: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark as no-show
exports.markNoShow = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const updated = await Reservation.findByIdAndUpdate(
      id,
      { status: "no-show" },
      { new: true }
    ).populate("table customer");

    // Free up table
    await Table.findByIdAndUpdate(reservation.table, { status: "available" });

    res.status(200).json({ message: "Marked as no-show", reservation: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get reservations statistics
exports.getReservationStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = {
      todayReservations: await Reservation.countDocuments({
        reservationDate: { $gte: today, $lt: tomorrow },
        status: { $in: ["confirmed", "arrived"] },
      }),
      confirmedToday: await Reservation.countDocuments({
        reservationDate: { $gte: today, $lt: tomorrow },
        status: "confirmed",
      }),
      arrivedToday: await Reservation.countDocuments({
        reservationDate: { $gte: today, $lt: tomorrow },
        status: "arrived",
      }),
      completedThisMonth: await Reservation.countDocuments({
        createdAt: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        status: "completed",
      }),
      totalGuests: 0,
    };

    const guestCount = await Reservation.aggregate([
      {
        $match: {
          reservationDate: { $gte: today, $lt: tomorrow },
          status: { $in: ["confirmed", "arrived"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$numberOfGuests" } } },
    ]);

    stats.totalGuests = guestCount.length > 0 ? guestCount[0].total : 0;

    res.status(200).json({ stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
