const Order = require("../models/order.model");
const MenuItem = require("../models/menuItem.model");
const Customer = require("../models/customer.model");
const Review = require("../models/review.model");

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (dateValue) => {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (dateValue) => {
  const date = new Date(dateValue);
  date.setHours(23, 59, 59, 999);
  return date;
};

const parseDateInput = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const resolveDateWindow = (query) => {
  const { range = "week", date, startDate, endDate } = query;
  const now = new Date();

  if (date) {
    const parsedDate = parseDateInput(date);
    if (!parsedDate) {
      return { error: "Invalid date format. Use YYYY-MM-DD." };
    }
    return {
      rangeLabel: "custom_day",
      startDate: startOfDay(parsedDate),
      endDate: endOfDay(parsedDate),
    };
  }

  if (startDate || endDate) {
    const parsedStart = parseDateInput(startDate);
    const parsedEnd = parseDateInput(endDate);
    if (!parsedStart || !parsedEnd) {
      return { error: "Both startDate and endDate are required in YYYY-MM-DD format." };
    }

    const customStart = startOfDay(parsedStart);
    const customEnd = endOfDay(parsedEnd);
    if (customEnd < customStart) {
      return { error: "endDate cannot be earlier than startDate." };
    }

    return {
      rangeLabel: "custom_range",
      startDate: customStart,
      endDate: customEnd,
    };
  }

  const windowEnd = now;
  const windowStart = new Date(now);

  if (range === "year") windowStart.setFullYear(now.getFullYear() - 1);
  else if (range === "month") windowStart.setMonth(now.getMonth() - 1);
  else if (range === "day") windowStart.setDate(now.getDate() - 1);
  else windowStart.setDate(now.getDate() - 7);

  return {
    rangeLabel: range,
    startDate: windowStart,
    endDate: windowEnd,
  };
};

// Get analytics data
exports.getAnalytics = async (req, res) => {
  try {
    const resolvedWindow = resolveDateWindow(req.query);
    if (resolvedWindow.error) {
      return res.status(400).json({ message: resolvedWindow.error });
    }

    const { rangeLabel, startDate, endDate } = resolvedWindow;
    const createdAtFilter = { $gte: startDate, $lte: endDate };

    // Total revenue and orders
    const orders = await Order.find({ createdAt: createdAtFilter });
    const totalRevenue = orders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
    const totalOrders = orders.length;

    // Previous period for growth calculation
    const durationMs = Math.max(endDate.getTime() - startDate.getTime(), DAY_MS);
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - durationMs);

    const prevOrders = await Order.find({
      createdAt: { $gte: prevStartDate, $lte: prevEndDate },
    });
    const prevRevenue = prevOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
    const revenueGrowth =
      prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

    // Customer analytics
    const activeCustomers = await Order.distinct("createdBy", { createdAt: createdAtFilter });
    const activeCustomerCount = activeCustomers.filter(Boolean).length;
    const newCustomers = await Customer.countDocuments({ createdAt: createdAtFilter });

    // User Reviews & Rating
    const reviews = await Review.find({ createdAt: createdAtFilter });
    const averageRating = reviews.length
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
      : 0;
    const totalReviews = reviews.length;

    // Order status distribution
    const orderStatusCounts = await Order.aggregate([
      { $match: { createdAt: createdAtFilter } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statusMap = {
      placed: 0,
      received: 0,
      preparing: 0,
      done_preparing: 0,
      served: 0,
      cancelled: 0,
    };

    orderStatusCounts.forEach((entry) => {
      statusMap[entry._id] = entry.count;
    });

    // Sales trend
    const salesTrend = await Order.aggregate([
      { $match: { createdAt: createdAtFilter } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$grandTotal" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const trendData = salesTrend.map((entry) => ({
      day: new Date(entry._id).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: Number(entry.revenue || 0),
    }));

    // Top items
    const topItems = await MenuItem.aggregate([
      {
        $lookup: {
          from: "orders",
          let: { itemId: "$_id" },
          pipeline: [
            { $match: { createdAt: createdAtFilter, "items.menuItem": { $eq: "$$itemId" } } },
            { $unwind: "$items" },
            { $match: { "items.menuItem": { $eq: "$$itemId" } } },
            {
              $group: {
                _id: null,
                count: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.totalPrice" },
              },
            },
          ],
          as: "orderInfo",
        },
      },
      {
        $lookup: {
          from: "reviews",
          let: { itemId: "$_id" },
          pipeline: [
            { $match: { menuItem: { $eq: "$$itemId" }, status: "approved" } },
            { $group: { _id: null, avg: { $avg: "$rating" } } },
          ],
          as: "reviewInfo",
        },
      },
      {
        $addFields: {
          orders: { $ifNull: [{ $arrayElemAt: ["$orderInfo.count", 0] }, 0] },
          revenue: { $ifNull: [{ $arrayElemAt: ["$orderInfo.revenue", 0] }, 0] },
          rating: { $ifNull: [{ $arrayElemAt: ["$reviewInfo.avg", 0] }, 0] },
        },
      },
      { $match: { orders: { $gt: 0 } } },
      { $sort: { orders: -1 } },
      { $limit: 10 },
      { $project: { name: 1, orders: 1, revenue: 1, rating: 1 } },
    ]);

    // Customer metrics
    const repeatCustomers = await Order.aggregate([
      { $match: { createdAt: createdAtFilter, createdBy: { $ne: null } } },
      { $group: { _id: "$createdBy", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: "total" },
    ]);

    const repeatCustomerCount = repeatCustomers.length > 0 ? repeatCustomers[0].total : 0;
    const repeatCustomerPercentage = activeCustomerCount
      ? Math.round((repeatCustomerCount / activeCustomerCount) * 100)
      : 0;
    const avgOrdersPerCustomer = activeCustomerCount ? totalOrders / activeCustomerCount : 0;

    // Satisfaction score (based on reviews)
    const satisfactionScore = averageRating > 0 ? Math.round((averageRating / 5) * 100) : 0;

    // Peak hours
    const peakHours = await Order.aggregate([
      { $match: { createdAt: createdAtFilter } },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          time: { $concat: [{ $toString: "$_id" }, ":00"] },
          orders: "$count",
        },
      },
    ]);

    return res.status(200).json({
      range: rangeLabel,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      activeCustomers: activeCustomerCount,
      newCustomers,
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews,
      revenueGrowth,
      completedOrders: statusMap.served,
      preparingOrders: statusMap.preparing + statusMap.done_preparing,
      pendingOrders: statusMap.placed + statusMap.received,
      cancelledOrders: statusMap.cancelled,
      salesTrend: trendData,
      topItems,
      repeatCustomerPercentage,
      avgOrdersPerCustomer: Number(avgOrdersPerCustomer.toFixed(1)),
      satisfactionScore,
      peakHours,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
