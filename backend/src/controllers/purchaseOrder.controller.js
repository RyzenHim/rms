const PurchaseOrder = require("../models/purchaseOrder.model");
const Supplier = require("../models/supplier.model");
const Inventory = require("../models/inventory.model");
const InventoryTransaction = require("../models/inventoryTransaction.model");
const { executeWithRetry } = require("../utils/transactionManager");

const getPurchaseOrderNumber = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `PO-${y}${m}${d}-${rand}`;
};

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const derivePaymentStatus = (subtotal, totalPaid) => {
    if (totalPaid <= 0) return "unpaid";
    if (totalPaid >= subtotal) return "paid";
    return "partial";
};

const deriveOrderStatus = (items = [], requestedStatus = "draft") => {
    const totalOrdered = items.reduce((sum, item) => sum + Number(item.orderedQuantity || 0), 0);
    const totalReceived = items.reduce((sum, item) => sum + Number(item.receivedQuantity || 0), 0);

    if (requestedStatus === "cancelled") return "cancelled";
    if (totalReceived <= 0) return requestedStatus === "ordered" ? "ordered" : "draft";
    if (totalReceived >= totalOrdered) return "received";
    return "partially_received";
};

const normalizePurchaseItems = async (items = []) => {
    if (!Array.isArray(items) || !items.length) {
        throw new Error("Purchase order must include at least one item");
    }

    const inventoryIds = items.map((item) => item.inventoryItem).filter(Boolean);
    const inventoryItems = await Inventory.find({ _id: { $in: inventoryIds }, isActive: true });
    const inventoryMap = new Map(inventoryItems.map((item) => [String(item._id), item]));

    if (inventoryItems.length !== inventoryIds.length) {
        throw new Error("One or more inventory items are invalid or inactive");
    }

    return items.map((item) => {
        const inventoryItem = inventoryMap.get(String(item.inventoryItem));
        const orderedQuantity = toNumber(item.orderedQuantity, NaN);
        const unitPrice = toNumber(item.unitPrice, NaN);
        const receivedQuantity = Math.min(orderedQuantity, Math.max(0, toNumber(item.receivedQuantity, 0)));

        if (!Number.isFinite(orderedQuantity) || orderedQuantity <= 0) {
            throw new Error(`Ordered quantity is required for ${inventoryItem.name}`);
        }
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            throw new Error(`Unit price is required for ${inventoryItem.name}`);
        }

        return {
            inventoryItem: inventoryItem._id,
            itemName: inventoryItem.name,
            category: inventoryItem.category,
            unit: inventoryItem.unit,
            orderedQuantity,
            receivedQuantity,
            unitPrice,
            lineTotal: Number((orderedQuantity * unitPrice).toFixed(2)),
            notes: String(item.notes || "").trim(),
        };
    });
};

exports.getPurchaseOrders = async (req, res) => {
    try {
        const { status = "", paymentStatus = "", supplier = "" } = req.query;
        const query = {};
        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (supplier) query.supplier = supplier;

        const purchaseOrders = await PurchaseOrder.find(query)
            .populate("supplier", "name contactPerson phone email")
            .populate("createdBy", "name roles")
            .sort({ createdAt: -1 });

        const summary = purchaseOrders.reduce(
            (acc, order) => {
                acc.totalOrders += 1;
                acc.totalValue += Number(order.subtotal || 0);
                acc.totalPaid += Number(order.totalPaid || 0);
                acc.totalDue += Number(order.balanceDue || 0);
                return acc;
            },
            { totalOrders: 0, totalValue: 0, totalPaid: 0, totalDue: 0 }
        );

        return res.status(200).json({ purchaseOrders, summary });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.getPurchaseOrder = async (req, res) => {
    try {
        const purchaseOrder = await PurchaseOrder.findById(req.params.id)
            .populate("supplier", "name contactPerson phone email address taxId notes")
            .populate("items.inventoryItem", "name category unit currentStock supplier")
            .populate("payments.recordedBy", "name roles")
            .populate("createdBy", "name roles");

        if (!purchaseOrder) {
            return res.status(404).json({ message: "Purchase order not found" });
        }

        return res.status(200).json({ purchaseOrder });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.createPurchaseOrder = async (req, res) => {
    try {
        const supplier = await Supplier.findOne({ _id: req.body.supplier, isActive: true });
        if (!supplier) {
            return res.status(400).json({ message: "Valid active supplier is required" });
        }

        const normalizedItems = await normalizePurchaseItems(req.body.items);
        const subtotal = Number(normalizedItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0).toFixed(2));
        const totalPaid = Math.min(subtotal, Math.max(0, toNumber(req.body.totalPaid, 0)));
        const balanceDue = Number(Math.max(0, subtotal - totalPaid).toFixed(2));
        const paymentStatus = derivePaymentStatus(subtotal, totalPaid);
        const status = deriveOrderStatus(normalizedItems, req.body.status || "draft");

        const purchaseOrder = await PurchaseOrder.create({
            purchaseOrderNumber: getPurchaseOrderNumber(),
            supplier: supplier._id,
            items: normalizedItems,
            status,
            paymentStatus,
            subtotal,
            totalPaid,
            balanceDue,
            notes: String(req.body.notes || "").trim(),
            expectedDeliveryDate: req.body.expectedDeliveryDate || null,
            orderedAt: req.body.orderedAt || new Date(),
            payments: totalPaid > 0
                ? [
                    {
                        amount: totalPaid,
                        method: req.body.paymentMethod || "other",
                        note: String(req.body.paymentNote || "Initial payment").trim(),
                        paidAt: req.body.paymentDate || new Date(),
                        recordedBy: req.user?._id || null,
                    },
                ]
                : [],
            createdBy: req.user._id,
        });

        const populated = await PurchaseOrder.findById(purchaseOrder._id)
            .populate("supplier", "name contactPerson phone email")
            .populate("createdBy", "name roles");

        return res.status(201).json({ message: "Purchase order created", purchaseOrder: populated });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.updatePurchaseOrder = async (req, res) => {
    try {
        const existing = await PurchaseOrder.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: "Purchase order not found" });
        }
        if (existing.status === "received" || existing.status === "cancelled") {
            return res.status(400).json({ message: "Received or cancelled purchase orders cannot be edited" });
        }

        const supplier = await Supplier.findOne({ _id: req.body.supplier || existing.supplier, isActive: true });
        if (!supplier) {
            return res.status(400).json({ message: "Valid active supplier is required" });
        }

        const normalizedItems = await normalizePurchaseItems(req.body.items || existing.items);
        const subtotal = Number(normalizedItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0).toFixed(2));
        const totalPaid = Math.min(subtotal, Math.max(0, Number(existing.totalPaid || 0)));
        const balanceDue = Number(Math.max(0, subtotal - totalPaid).toFixed(2));
        const paymentStatus = derivePaymentStatus(subtotal, totalPaid);
        const status = deriveOrderStatus(normalizedItems, req.body.status || existing.status);

        existing.supplier = supplier._id;
        existing.items = normalizedItems;
        existing.status = status;
        existing.paymentStatus = paymentStatus;
        existing.subtotal = subtotal;
        existing.totalPaid = totalPaid;
        existing.balanceDue = balanceDue;
        existing.notes = String(req.body.notes ?? existing.notes ?? "").trim();
        existing.expectedDeliveryDate = req.body.expectedDeliveryDate ?? existing.expectedDeliveryDate ?? null;
        existing.orderedAt = req.body.orderedAt ?? existing.orderedAt;
        if (status === "received") {
            existing.receivedAt = existing.receivedAt || new Date();
        }

        await existing.save();

        const populated = await PurchaseOrder.findById(existing._id)
            .populate("supplier", "name contactPerson phone email")
            .populate("createdBy", "name roles");

        return res.status(200).json({ message: "Purchase order updated", purchaseOrder: populated });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.recordPurchasePayment = async (req, res) => {
    try {
        const { amount, method = "other", note = "", paidAt } = req.body;
        const paymentAmount = toNumber(amount, NaN);

        if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
            return res.status(400).json({ message: "Valid payment amount is required" });
        }

        const purchaseOrder = await PurchaseOrder.findById(req.params.id);
        if (!purchaseOrder) {
            return res.status(404).json({ message: "Purchase order not found" });
        }
        if (purchaseOrder.status === "cancelled") {
            return res.status(400).json({ message: "Cancelled purchase orders cannot receive payments" });
        }

        const nextTotalPaid = Number((Number(purchaseOrder.totalPaid || 0) + paymentAmount).toFixed(2));
        if (nextTotalPaid > Number(purchaseOrder.subtotal || 0)) {
            return res.status(400).json({ message: "Payment exceeds total purchase order amount" });
        }

        purchaseOrder.payments.push({
            amount: paymentAmount,
            method,
            note: String(note || "").trim(),
            paidAt: paidAt || new Date(),
            recordedBy: req.user?._id || null,
        });
        purchaseOrder.totalPaid = nextTotalPaid;
        purchaseOrder.balanceDue = Number(Math.max(0, Number(purchaseOrder.subtotal || 0) - nextTotalPaid).toFixed(2));
        purchaseOrder.paymentStatus = derivePaymentStatus(Number(purchaseOrder.subtotal || 0), nextTotalPaid);
        await purchaseOrder.save();

        return res.status(200).json({ message: "Payment recorded", purchaseOrder });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.receivePurchaseOrderItems = async (req, res) => {
    try {
        const updates = Array.isArray(req.body.items) ? req.body.items : [];
        if (!updates.length) {
            return res.status(400).json({ message: "At least one received item is required" });
        }

        const purchaseOrder = await executeWithRetry(async (session) => {
            const order = await PurchaseOrder.findById(req.params.id).session(session);
            if (!order) {
                throw new Error("Purchase order not found");
            }
            if (order.status === "cancelled") {
                throw new Error("Cancelled purchase orders cannot receive stock");
            }

            const supplier = await Supplier.findById(order.supplier).session(session);
            const inventoryIds = updates.map((item) => item.inventoryItem);
            const inventoryItems = await Inventory.find({ _id: { $in: inventoryIds }, isActive: true }).session(session);
            const inventoryMap = new Map(inventoryItems.map((item) => [String(item._id), item]));

            for (const update of updates) {
                const inventoryId = String(update.inventoryItem || "");
                const quantityReceived = toNumber(update.quantityReceived, NaN);
                if (!inventoryId || !Number.isFinite(quantityReceived) || quantityReceived <= 0) {
                    throw new Error("Each received item requires inventoryItem and quantityReceived");
                }

                const lineItem = order.items.find((item) => String(item.inventoryItem) === inventoryId);
                if (!lineItem) {
                    throw new Error("Received item is not part of this purchase order");
                }

                const remaining = Number(lineItem.orderedQuantity || 0) - Number(lineItem.receivedQuantity || 0);
                if (quantityReceived > remaining) {
                    throw new Error(`Received quantity exceeds pending quantity for ${lineItem.itemName}`);
                }

                const inventoryItem = inventoryMap.get(inventoryId);
                if (!inventoryItem) {
                    throw new Error(`Inventory item for ${lineItem.itemName} is missing or inactive`);
                }

                lineItem.receivedQuantity = Number((Number(lineItem.receivedQuantity || 0) + quantityReceived).toFixed(3));
                inventoryItem.currentStock = Number((Number(inventoryItem.currentStock || 0) + quantityReceived).toFixed(3));
                inventoryItem.lastRestocked = new Date();
                inventoryItem.supplier = supplier?.name || inventoryItem.supplier || "";
                await inventoryItem.save({ session });

                await InventoryTransaction.create(
                    [
                        {
                            inventoryItem: inventoryItem._id,
                            quantity: quantityReceived,
                            direction: "in",
                            source: "purchase_order_receipt",
                            reason: `Received against ${order.purchaseOrderNumber}`,
                            notes: String(update.notes || "").trim(),
                            resultingStock: Number(inventoryItem.currentStock || 0),
                            performedBy: req.user?._id || null,
                            eventContext: order.purchaseOrderNumber,
                        },
                    ],
                    { session }
                );
            }

            order.status = deriveOrderStatus(order.items, order.status === "draft" ? "ordered" : order.status);
            if (order.status === "received") {
                order.receivedAt = new Date();
            }
            await order.save({ session });

            return order;
        });

        return res.status(200).json({ message: "Purchase order items received", purchaseOrder });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.deletePurchaseOrder = async (req, res) => {
    try {
        const purchaseOrder = await PurchaseOrder.findById(req.params.id);
        if (!purchaseOrder) {
            return res.status(404).json({ message: "Purchase order not found" });
        }
        if (purchaseOrder.status === "received") {
            return res.status(400).json({ message: "Received purchase orders cannot be deleted" });
        }

        await purchaseOrder.deleteOne();
        return res.status(200).json({ message: "Purchase order deleted" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
