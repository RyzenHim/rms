const Customer = require("../models/customer.model");
const User = require("../models/user.model");
const Order = require("../models/order.model");

const formatCustomer = (customer, orderData = { count: 0, totalSpent: 0 }) => ({
    id: customer._id,
    userId: customer.user?._id,
    name: customer.user?.name || "Unknown",
    email: customer.user?.email || "",
    phone: customer.phone || "",
    isActive: customer.user?.isActive ?? true,
    isBlocked: Boolean(customer.isBlocked),
    isDeleted: Boolean(customer.isDeleted),
    totalOrders: customer.totalOrders || orderData.count || 0,
    totalSpent: orderData.totalSpent || 0,
    loyaltyPoints: customer.loyaltyPoints || 0,
    lastOrderDate: customer.lastOrderDate || null,
    createdAt: customer.user?.createdAt || customer.createdAt,
    addresses: customer.addresses || [],
});

const getCustomerOrderStats = async (phones = []) => {
    const validPhones = phones.filter(Boolean);
    if (!validPhones.length) {
        return new Map();
    }

    const orderCounts = await Order.aggregate([
        { $match: { customerPhone: { $in: validPhones }, status: { $nin: ["cancelled"] } } },
        { $group: { _id: "$customerPhone", count: { $sum: 1 }, totalSpent: { $sum: "$grandTotal" } } },
    ]);

    return new Map(orderCounts.map((order) => [order._id, { count: order.count, totalSpent: order.totalSpent }]));
};

exports.getAllCustomers = async (req, res) => {
    try {
        const { search = "", status = "all", page = 1, limit = 50 } = req.query;
        const query = {};

        if (status === "active") {
            query.isDeleted = { $ne: true };
            query.isBlocked = false;
        } else if (status === "inactive") {
            query.isDeleted = { $ne: true };
            query.isBlocked = true;
        } else if (status === "deleted") {
            query.isDeleted = true;
        }

        if (search) {
            const searchRegex = new RegExp(search, "i");
            const users = await User.find({
                $or: [{ name: searchRegex }, { email: searchRegex }],
                roles: "customer",
            }).select("_id");

            const userIds = users.map((entry) => entry._id);
            query.$or = [{ user: { $in: userIds } }, { phone: searchRegex }];
        }

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        const [customers, total] = await Promise.all([
            Customer.find(query)
                .populate("user", "name email isActive isDeleted profileImage createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit, 10)),
            Customer.countDocuments(query),
        ]);

        const orderMap = await getCustomerOrderStats(customers.map((customer) => customer.phone));
        const formattedCustomers = customers.map((customer) =>
            formatCustomer(customer, orderMap.get(customer.phone)),
        );

        return res.status(200).json({
            customers: formattedCustomers,
            pagination: {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                total,
                pages: Math.ceil(total / parseInt(limit, 10)),
            },
        });
    } catch (error) {
        console.error("GET ALL CUSTOMERS ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findById(id).populate("user", "name email isActive isDeleted profileImage createdAt");

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const orders = await Order.find({ customerPhone: customer.phone })
            .populate("items.menuItem", "name")
            .sort({ createdAt: -1 })
            .limit(50);

        const orderMap = await getCustomerOrderStats([customer.phone]);

        return res.status(200).json({
            customer: formatCustomer(customer, orderMap.get(customer.phone)),
            orders,
        });
    } catch (error) {
        console.error("GET CUSTOMER BY ID ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, isActive, isBlocked, loyaltyPoints } = req.body;
        const customer = await Customer.findById(id).populate("user");

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }
        if (customer.isDeleted) {
            return res.status(400).json({ message: "Restore the customer before editing the record" });
        }

        if (name && customer.user) {
            customer.user.name = String(name).trim();
        }
        if (phone !== undefined) customer.phone = String(phone || "").trim();
        if (loyaltyPoints !== undefined) customer.loyaltyPoints = Number(loyaltyPoints || 0);
        if (isBlocked !== undefined) customer.isBlocked = Boolean(isBlocked);

        if (isActive !== undefined && customer.user) {
            customer.user.isActive = Boolean(isActive);
            customer.isBlocked = !Boolean(isActive);
            customer.user.isDeleted = false;
        }

        await customer.save();
        if (customer.user) {
            await customer.user.save();
        }

        const updatedCustomer = await Customer.findById(id).populate("user", "name email isActive isDeleted createdAt");
        const orderMap = await getCustomerOrderStats([updatedCustomer.phone]);

        return res.status(200).json({
            message: "Customer updated successfully",
            customer: formatCustomer(updatedCustomer, orderMap.get(updatedCustomer.phone)),
        });
    } catch (error) {
        console.error("UPDATE CUSTOMER ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findById(id).populate("user");

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }
        if (customer.isDeleted) {
            return res.status(400).json({ message: "Customer is already in deleted records" });
        }

        customer.isDeleted = true;
        customer.isBlocked = true;
        await customer.save();

        if (customer.user) {
            customer.user.isActive = false;
            customer.user.isDeleted = true;
            await customer.user.save();
        }

        return res.status(200).json({ message: "Customer moved to deleted records" });
    } catch (error) {
        console.error("DELETE CUSTOMER ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.restoreCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findById(id).populate("user");

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        customer.isDeleted = false;
        customer.isBlocked = false;
        await customer.save();

        if (customer.user) {
            customer.user.isActive = true;
            customer.user.isDeleted = false;
            await customer.user.save();
        }

        return res.status(200).json({ message: "Customer restored successfully" });
    } catch (error) {
        console.error("RESTORE CUSTOMER ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.toggleCustomerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const customer = await Customer.findById(id).populate("user");

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }
        if (customer.isDeleted) {
            return res.status(400).json({ message: "Restore the customer before changing active status" });
        }

        customer.isBlocked = !Boolean(isActive);
        await customer.save();

        if (customer.user) {
            customer.user.isActive = Boolean(isActive);
            customer.user.isDeleted = false;
            await customer.user.save();
        }

        return res.status(200).json({
            message: isActive ? "Customer activated successfully" : "Customer deactivated successfully",
            isActive: Boolean(isActive),
        });
    } catch (error) {
        console.error("TOGGLE CUSTOMER STATUS ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.getCustomerStats = async (req, res) => {
    try {
        const totalCustomers = await Customer.countDocuments({ isDeleted: { $ne: true } });
        const activeCustomers = await Customer.countDocuments({ isDeleted: { $ne: true }, isBlocked: false });
        const inactiveCustomers = await Customer.countDocuments({ isDeleted: { $ne: true }, isBlocked: true });
        const deletedCustomers = await Customer.countDocuments({ isDeleted: true });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const newThisMonth = await User.countDocuments({
            roles: "customer",
            createdAt: { $gte: startOfMonth },
            isDeleted: { $ne: true },
        });

        const orderStats = await Order.aggregate([
            { $match: { status: { $nin: ["cancelled"] } } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$grandTotal" },
                },
            },
        ]);

        return res.status(200).json({
            stats: {
                totalCustomers,
                activeCustomers,
                inactiveCustomers,
                deletedCustomers,
                newThisMonth,
                totalOrders: orderStats[0]?.totalOrders || 0,
                totalRevenue: orderStats[0]?.totalRevenue || 0,
            },
        });
    } catch (error) {
        console.error("GET CUSTOMER STATS ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
