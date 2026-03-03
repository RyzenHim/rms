const Order = require("../models/order.model");
const MenuItem = require("../models/menuItem.model");
const Customer = require("../models/customer.model");

const TAX_RATE = 0.05;

const getOrderNumber = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${y}${m}${d}-${rand}`;
};

const toValidQuantity = (value) => {
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 1) return null;
    return Math.floor(qty);
};

const canViewAllOrders = (roles = []) =>
    roles.includes("admin") ||
    roles.includes("manager") ||
    roles.includes("kitchen") ||
    roles.includes("cashier");

const parseOrderStatusUpdate = (roles = [], currentStatus, nextStatus) => {
    const kitchenStatuses = ["received", "preparing", "done_preparing"];
    const waiterStatuses = ["served", "cancelled"];
    const adminStatuses = [
        "placed",
        "received",
        "preparing",
        "done_preparing",
        "served",
        "cancelled",
    ];

    if (roles.includes("admin") || roles.includes("manager")) {
        return adminStatuses.includes(nextStatus);
    }
    if (roles.includes("kitchen")) {
        return kitchenStatuses.includes(nextStatus) && currentStatus !== "served" && currentStatus !== "cancelled";
    }
    if (roles.includes("waiter")) {
        return waiterStatuses.includes(nextStatus);
    }
    return false;
};

exports.getOrders = async (req, res) => {
    try {
        const roles = req.user.roles || [];
        const { status = "" } = req.query;
        const query = { restaurant: req.restaurant._id };

        if (status) {
            query.status = status;
        }

        if (!canViewAllOrders(roles)) {
            query.createdBy = req.user._id;
        } else if (roles.includes("kitchen") && !status) {
            query.status = { $nin: ["served", "cancelled"] };
        }

        const orders = await Order.find(query)
            .populate("createdBy", "name email roles")
            .populate("items.menuItem", "name image")
            .sort({ createdAt: -1 })
            .limit(200);

        return res.status(200).json({ orders });
    } catch (error) {
        console.error("GET ORDERS ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const { tableNumber, customerName = "", customerEmail = "", customerPhone = "", notes = "", items = [] } = req.body;

        if (!tableNumber || !String(tableNumber).trim()) {
            return res.status(400).json({ message: "Table number is required" });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "At least one order item is required" });
        }

        const normalizedItems = [];
        let subTotal = 0;

        for (const item of items) {
            const menuItemId = item?.menuItem;
            const quantity = toValidQuantity(item?.quantity);
            if (!menuItemId || !quantity) {
                return res.status(400).json({ message: "Each item requires menuItem and quantity >= 1" });
            }

            const menuItem = await MenuItem.findOne({ _id: menuItemId, isActive: true }).select(
                "name price"
            );
            if (!menuItem) {
                return res.status(400).json({ message: "Invalid menu item in order" });
            }

            const unitPrice = Number(menuItem.price || 0);
            const totalPrice = Number((unitPrice * quantity).toFixed(2));
            subTotal += totalPrice;

            normalizedItems.push({
                menuItem: menuItem._id,
                name: menuItem.name,
                quantity,
                unitPrice,
                totalPrice,
                notes: String(item?.notes || "").trim(),
            });
        }

        const taxAmount = Number((subTotal * TAX_RATE).toFixed(2));
        const grandTotal = Number((subTotal + taxAmount).toFixed(2));

        const order = await Order.create({
            orderNumber: getOrderNumber(),
            restaurant: req.restaurant._id,
            tableNumber: String(tableNumber).trim(),
            customerName: String(customerName || "").trim(),
            customerEmail: String(customerEmail || "").trim().toLowerCase(),
            customerPhone: String(customerPhone || "").trim(),
            createdBy: req.user._id,
            items: normalizedItems,
            notes: String(notes).trim(),
            subTotal,
            taxAmount,
            grandTotal,
        });

        const populated = await Order.findById(order._id)
            .populate("createdBy", "name email roles")
            .populate("items.menuItem", "name image");

        if ((req.user.roles || []).includes("customer")) {
            const customer = await Customer.findOne({
                user: req.user._id,
                restaurant: req.restaurant._id,
            });
            if (customer) {
                if (!customer.phone && customerPhone) customer.phone = customerPhone;
                customer.totalOrders = Number(customer.totalOrders || 0) + 1;
                customer.lastOrderDate = new Date();
                await customer.save();
            }
        } else if (customerPhone) {
            const matchedCustomer = await Customer.findOne({
                phone: String(customerPhone).trim(),
                restaurant: req.restaurant._id,
            });
            if (matchedCustomer) {
                matchedCustomer.totalOrders = Number(matchedCustomer.totalOrders || 0) + 1;
                matchedCustomer.lastOrderDate = new Date();
                await matchedCustomer.save();
            }
        }

        return res.status(201).json({ message: "Order created", order: populated });
    } catch (error) {
        console.error("CREATE ORDER ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "status is required" });
        }

        const order = await Order.findOne({ _id: id, restaurant: req.restaurant._id });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const allowed = parseOrderStatusUpdate(req.user.roles || [], order.status, status);
        if (!allowed) {
            return res.status(403).json({ message: "You cannot set this order status" });
        }

        order.status = status;
        if (status === "done_preparing") {
            order.readyAt = new Date();
            order.readyNotification = {
                sent: false,
                sentAt: null,
            };
        }
        await order.save();

        const populated = await Order.findById(order._id)
            .populate("createdBy", "name email roles")
            .populate("items.menuItem", "name image");

        return res.status(200).json({ message: "Order status updated", order: populated });
    } catch (error) {
        console.error("UPDATE ORDER STATUS ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus, paymentMethod = "", paymentNote = "" } = req.body;
        const roles = req.user.roles || [];

        if (!["cashier", "manager", "admin"].some((role) => roles.includes(role))) {
            return res.status(403).json({ message: "You cannot update payment status" });
        }

        if (!paymentStatus || !["pending", "paid", "refunded"].includes(paymentStatus)) {
            return res.status(400).json({ message: "Valid paymentStatus is required" });
        }

        const order = await Order.findOne({ _id: id, restaurant: req.restaurant._id });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        order.paymentStatus = paymentStatus;
        order.paymentMethod = paymentStatus === "paid" ? String(paymentMethod || "").trim() : "";
        order.paymentNote = String(paymentNote || "").trim();
        order.paidAt = paymentStatus === "paid" ? new Date() : null;
        await order.save();

        const populated = await Order.findById(order._id)
            .populate("createdBy", "name email roles")
            .populate("items.menuItem", "name image");

        return res.status(200).json({ message: "Payment status updated", order: populated });
    } catch (error) {
        console.error("UPDATE PAYMENT STATUS ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
