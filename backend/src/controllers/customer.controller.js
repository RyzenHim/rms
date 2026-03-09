const Customer = require("../models/customer.model");
const User = require("../models/user.model");
const Order = require("../models/order.model");

// Get all customers (admin only)
exports.getAllCustomers = async (req, res) => {
    try {
        const { search = "", isActive = "", page = 1, limit = 50 } = req.query;

        const query = { isDeleted: false };

        // Search by name, email, or phone
        if (search) {
            const searchRegex = new RegExp(search, "i");
            const users = await User.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex }
                ],
                roles: "customer"
            }).select("_id");

            const userIds = users.map(u => u._id);
            query.$or = [
                { user: { $in: userIds } },
                { phone: searchRegex }
            ];
        }

        // Filter by isActive
        if (isActive !== "") {
            query.isBlocked = isActive === "active";
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [customers, total] = await Promise.all([
            Customer.find(query)
                .populate("user", "name email isActive profileImage createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Customer.countDocuments(query)
        ]);

        // Get order counts for each customer by phone
        const phones = customers.map(c => c.phone).filter(p => p);
        const orderCounts = await Order.aggregate([
            { $match: { customerPhone: { $in: phones }, status: { $nin: ["cancelled"] } } },
            { $group: { _id: "$customerPhone", count: { $sum: 1 }, totalSpent: { $sum: "$grandTotal" } } }
        ]);

        const orderCountMap = new Map(orderCounts.map(o => [o._id, { count: o.count, totalSpent: o.totalSpent }]));

        const formattedCustomers = customers.map(customer => {
            const orderData = orderCountMap.get(customer.phone) || { count: 0, totalSpent: 0 };
            return {
                id: customer._id,
                userId: customer.user?._id,
                name: customer.user?.name || "Unknown",
                email: customer.user?.email || "",
                phone: customer.phone || "",
                isActive: customer.user?.isActive ?? true,
                isBlocked: customer.isBlocked,
                totalOrders: customer.totalOrders || orderData.count,
                totalSpent: orderData.totalSpent || 0,
                loyaltyPoints: customer.loyaltyPoints || 0,
                lastOrderDate: customer.lastOrderDate,
                createdAt: customer.user?.createdAt || customer.createdAt,
                addresses: customer.addresses || []
            };
        });

        res.status(200).json({
            customers: formattedCustomers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("GET ALL CUSTOMERS ERROR:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get single customer by ID (admin only)
exports.getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await Customer.findById(id).populate("user", "name email isActive profileImage createdAt");

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Get customer's orders by phone
        const orders = await Order.find({ customerPhone: customer.phone })
            .populate("items.menuItem", "name")
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            customer: {
                id: customer._id,
                userId: customer.user?._id,
                name: customer.user?.name || "Unknown",
                email: customer.user?.email || "",
                phone: customer.phone || "",
                isActive: customer.user?.isActive ?? true,
                isBlocked: customer.isBlocked,
                totalOrders: customer.totalOrders || 0,
                loyaltyPoints: customer.loyaltyPoints || 0,
                lastOrderDate: customer.lastOrderDate,
                createdAt: customer.user?.createdAt || customer.createdAt,
                addresses: customer.addresses || []
            },
            orders
        });
    } catch (error) {
        console.error("GET CUSTOMER BY ID ERROR:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update customer (admin only)
exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, isActive, isBlocked, loyaltyPoints } = req.body;

        const customer = await Customer.findById(id).populate("user");

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Update user name if provided
        if (name && customer.user) {
            customer.user.name = name;
            await customer.user.save();
        }

        // Update customer fields
        if (phone !== undefined) customer.phone = phone;
        if (loyaltyPoints !== undefined) customer.loyaltyPoints = loyaltyPoints;
        if (isBlocked !== undefined) customer.isBlocked = isBlocked;

        await customer.save();

        // Update user isActive if provided
        if (isActive !== undefined && customer.user) {
            customer.user.isActive = isActive;
            await customer.user.save();
        }

        const updatedCustomer = await Customer.findById(id).populate("user", "name email isActive");

        res.status(200).json({
            message: "Customer updated successfully",
            customer: {
                id: updatedCustomer._id,
                userId: updatedCustomer.user?._id,
                name: updatedCustomer.user?.name || "Unknown",
                email: updatedCustomer.user?.email || "",
                phone: updatedCustomer.phone || "",
                isActive: updatedCustomer.user?.isActive ?? true,
                isBlocked: updatedCustomer.isBlocked,
                totalOrders: updatedCustomer.totalOrders || 0,
                loyaltyPoints: updatedCustomer.loyaltyPoints || 0,
                createdAt: updatedCustomer.user?.createdAt || updatedCustomer.createdAt
            }
        });
    } catch (error) {
        console.error("UPDATE CUSTOMER ERROR:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Soft delete customer (admin only)
exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Soft delete - mark isDeleted as true
        customer.isDeleted = true;
        await customer.save();

        // Also deactivate the user account
        if (customer.user) {
            await User.findByIdAndUpdate(customer.user, { isActive: false });
        }

        res.status(200).json({ message: "Customer deleted successfully" });
    } catch (error) {
        console.error("DELETE CUSTOMER ERROR:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Toggle customer active status (admin only)
exports.toggleCustomerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const customer = await Customer.findById(id).populate("user");

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Update both customer blocked status and user isActive
        customer.isBlocked = !isActive;
        await customer.save();

        if (customer.user) {
            customer.user.isActive = isActive;
            await customer.user.save();
        }

        res.status(200).json({
            message: isActive ? "Customer activated successfully" : "Customer deactivated successfully",
            isActive
        });
    } catch (error) {
        console.error("TOGGLE CUSTOMER STATUS ERROR:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get customer statistics (admin only)
exports.getCustomerStats = async (req, res) => {
    try {
        const totalCustomers = await Customer.countDocuments({ isDeleted: false });
        const activeCustomers = await User.countDocuments({ roles: "customer", isActive: true });
        const blockedCustomers = await Customer.countDocuments({ isBlocked: true, isDeleted: false });

        // Get new customers this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const newThisMonth = await User.countDocuments({
            roles: "customer",
            createdAt: { $gte: startOfMonth }
        });

        // Get total order count and revenue
        const orderStats = await Order.aggregate([
            { $match: { status: { $nin: ["cancelled"] } } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$grandTotal" }
                }
            }
        ]);

        res.status(200).json({
            stats: {
                totalCustomers,
                activeCustomers,
                blockedCustomers,
                newThisMonth,
                totalOrders: orderStats[0]?.totalOrders || 0,
                totalRevenue: orderStats[0]?.totalRevenue || 0
            }
        });
    } catch (error) {
        console.error("GET CUSTOMER STATS ERROR:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

