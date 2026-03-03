const Reservation = require("../models/reservation.model");
const Table = require("../models/table.model");
const Customer = require("../models/customer.model");

const getCustomerFromRequest = async (req) =>
  Customer.findOne({
    user: req.user._id,
    restaurant: req.restaurant._id,
  }).populate("user");

// Create reservation
exports.createReservation = async (req, res) => {
  try {
    const { tableId, numberOfGuests, reservationDate, reservationTime, specialRequests, occasion } = req.body;

    // Validate inputs
    if (!tableId || !numberOfGuests || !reservationDate || !reservationTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Get customer details
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Check table exists and has capacity
    const table = await Table.findOne({
      _id: tableId,
      restaurant: req.restaurant._id,
      isActive: true,
    });
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    if (table.capacity < numberOfGuests) {
      return res.status(400).json({ message: `Table capacity is ${table.capacity}, but ${numberOfGuests} guests requested` });
    }

    // Check for conflicting reservations
    const conflictingReservation = await Reservation.findOne({
      restaurant: req.restaurant._id,
      table: tableId,
      reservationDate: {
        $gte: new Date(reservationDate),
        $lt: new Date(new Date(reservationDate).getTime() + 24 * 60 * 60 * 1000),
      },
      status: { $in: ["confirmed", "arrived"] },
    });

    if (conflictingReservation) {
      return res.status(400).json({ message: "Table is already reserved for this time" });
    }

    // Create reservation
    const reservation = await Reservation.create({
      restaurant: req.restaurant._id,
      customer: customer._id,
      customerName: customer.user.name,
      customerPhone: customer.user.phone || "",
      customerEmail: customer.user.email,
      table: tableId,
      numberOfGuests,
      reservationDate: new Date(reservationDate),
      reservationTime,
      specialRequests,
      occasion,
    });

    const populatedReservation = await reservation.populate("table customer");

    // Update table status
    await Table.findOneAndUpdate(
      { _id: tableId, restaurant: req.restaurant._id },
      { status: "reserved" }
    );

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

    let query = {
      restaurant: req.restaurant._id,
      customer: customer._id,
    };
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
    let query = { restaurant: req.restaurant._id };

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

    const reservation = await Reservation.findOne({
      _id: id,
      restaurant: req.restaurant._id,
    }).populate("table customer");
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

    const reservation = await Reservation.findOne({
      _id: id,
      restaurant: req.restaurant._id,
    });
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

    const updatedReservation = await Reservation.findOneAndUpdate(
      { _id: id, restaurant: req.restaurant._id },
      updates,
      { new: true }
    ).populate("table customer");

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

    const reservation = await Reservation.findOne({
      _id: id,
      restaurant: req.restaurant._id,
    });
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
    const updated = await Reservation.findOneAndUpdate(
      { _id: id, restaurant: req.restaurant._id },
      {
        status: "cancelled",
        cancellationReason: reason || "",
      },
      { new: true }
    ).populate("table customer");

    // Free up table
    await Table.findOneAndUpdate(
      { _id: reservation.table, restaurant: req.restaurant._id },
      { status: "available" }
    );

    res.status(200).json({ message: "Reservation cancelled", reservation: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark as check-in (check-in at restaurant)
exports.checkInReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findOne({
      _id: id,
      restaurant: req.restaurant._id,
    });
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status !== "confirmed") {
      return res.status(400).json({ message: "Only confirmed reservations can be checked in" });
    }

    const updated = await Reservation.findOneAndUpdate(
      { _id: id, restaurant: req.restaurant._id },
      {
        status: "arrived",
        checkinTime: new Date(),
      },
      { new: true }
    ).populate("table customer");

    // Update table status to occupied
    await Table.findOneAndUpdate(
      { _id: reservation.table, restaurant: req.restaurant._id },
      { status: "occupied" }
    );

    res.status(200).json({ message: "Checked in successfully", reservation: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark as check-out (complete reservation)
exports.checkOutReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findOne({
      _id: id,
      restaurant: req.restaurant._id,
    });
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status !== "arrived") {
      return res.status(400).json({ message: "Only arrived reservations can be checked out" });
    }

    const updated = await Reservation.findOneAndUpdate(
      { _id: id, restaurant: req.restaurant._id },
      {
        status: "completed",
        checkoutTime: new Date(),
      },
      { new: true }
    ).populate("table customer");

    // Free up table
    await Table.findOneAndUpdate(
      { _id: reservation.table, restaurant: req.restaurant._id },
      { status: "available" }
    );

    res.status(200).json({ message: "Checked out successfully", reservation: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark as no-show
exports.markNoShow = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findOne({
      _id: id,
      restaurant: req.restaurant._id,
    });
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const updated = await Reservation.findOneAndUpdate(
      { _id: id, restaurant: req.restaurant._id },
      { status: "no-show" },
      { new: true }
    ).populate("table customer");

    // Free up table
    await Table.findOneAndUpdate(
      { _id: reservation.table, restaurant: req.restaurant._id },
      { status: "available" }
    );

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
        restaurant: req.restaurant._id,
        reservationDate: { $gte: today, $lt: tomorrow },
        status: { $in: ["confirmed", "arrived"] },
      }),
      confirmedToday: await Reservation.countDocuments({
        restaurant: req.restaurant._id,
        reservationDate: { $gte: today, $lt: tomorrow },
        status: "confirmed",
      }),
      arrivedToday: await Reservation.countDocuments({
        restaurant: req.restaurant._id,
        reservationDate: { $gte: today, $lt: tomorrow },
        status: "arrived",
      }),
      completedThisMonth: await Reservation.countDocuments({
        restaurant: req.restaurant._id,
        createdAt: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        status: "completed",
      }),
      totalGuests: 0,
    };

    const guestCount = await Reservation.aggregate([
      {
        $match: {
          restaurant: req.restaurant._id,
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
