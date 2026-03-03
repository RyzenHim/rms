const Order = require("../models/order.model");
const MenuItem = require("../models/menuItem.model");
const Customer = require("../models/customer.model");
const Review = require("../models/review.model");

// Get analytics data
exports.getAnalytics = async (req, res) => {
  try {
    const { range = "week" } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    if (range === "week") startDate.setDate(now.getDate() - 7);
    else if (range === "month") startDate.setMonth(now.getMonth() - 1);
    else if (range === "year") startDate.setFullYear(now.getFullYear() - 1);

    // Total revenue and orders
    const orders = await Order.find({ createdAt: { $gte: startDate } }).populate("items.menuItem");

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrders = orders.length;

    // Previous period for growth calculation
    let prevStartDate = new Date(startDate);
    let prevEndDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - (now - startDate) / (1000 * 60 * 60 * 24));

    const prevOrders = await Order.find({
      createdAt: { $gte: prevStartDate, $lt: startDate },
    });
    const prevRevenue = prevOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const revenueGrowth = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

    // Customer analytics
    const activeCustomers = await Order.distinct("customer", { createdAt: { $gte: startDate } });
    const newCustomers = await Customer.countDocuments({ createdAt: { $gte: startDate } });

    // User Reviews & Rating
    const reviews = await Review.find({ createdAt: { $gte: startDate } });
    const averageRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;
    const totalReviews = reviews.length;

    // Order status distribution
    const orderStatusCounts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statusMap = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      served: 0,
    };

    orderStatusCounts.forEach((item) => {
      statusMap[item._id] = item.count;
    });

    // Sales trend
    const salesTrend = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const trendData = salesTrend.map((item) => ({
      day: new Date(item._id).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: item.revenue,
    }));

    // Top items
    const topItems = await MenuItem.aggregate([
      {
        $lookup: {
          from: "orders",
          let: { itemId: "$_id" },
          pipeline: [
            { $match: { createdAt: { $gte: startDate }, "items.menuItem": { $eq: "$$itemId" } } },
            { $unwind: "$items" },
            { $match: { "items.menuItem": { $eq: "$$itemId" } } },
            { $group: { _id: null, count: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } } } },
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
      { $addFields: { orders: { $arrayElemAt: ["$orderInfo.count", 0] }, revenue: { $arrayElemAt: ["$orderInfo.revenue", 0] }, rating: { $arrayElemAt: ["$reviewInfo.avg", 0] } } },
      { $match: { orders: { $gt: 0 } } },
      { $sort: { orders: -1 } },
      { $limit: 10 },
      { $project: { name: 1, orders: 1, revenue: 1, rating: 1 } },
    ]);

    // Customer metrics
    const repeatCustomers = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$customer", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: "total" },
    ]);

    const repeatCustomerCount = repeatCustomers.length > 0 ? repeatCustomers[0].total : 0;
    const repeatCustomerPercentage = activeCustomers.length > 0 ? Math.round((repeatCustomerCount / activeCustomers.length) * 100) : 0;
    const avgOrdersPerCustomer = activeCustomers.length > 0 ? (totalOrders / activeCustomers.length).toFixed(1) : 0;

    // Satisfaction score (based on reviews)
    const satisfactionScore = reviews.length > 0 ? Math.round((averageRating / 5) * 100) : 0;

    // Peak hours
    const peakHours = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          time: { $concat: [{ $toString: "$_id" }, ":00"] },
          orders: "$count",
        },
      },
    ])
      .slice(0, 6)
      .exec();

    res.status(200).json({
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      activeCustomers: activeCustomers.length,
      newCustomers,
      averageRating: parseFloat(averageRating),
      totalReviews,
      revenueGrowth,
      completedOrders: statusMap.served,
      preparingOrders: statusMap.preparing,
      pendingOrders: statusMap.pending + statusMap.confirmed,
      cancelledOrders: 0,
      salesTrend: trendData,
      topItems,
      repeatCustomerPercentage,
      avgOrdersPerCustomer: parseFloat(avgOrdersPerCustomer),
      satisfactionScore,
      peakHours,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
