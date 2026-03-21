const Supplier = require("../models/supplier.model");
const PurchaseOrder = require("../models/purchaseOrder.model");

const normalizeSupplierPayload = (payload = {}) => ({
    name: String(payload.name || "").trim(),
    contactPerson: String(payload.contactPerson || "").trim(),
    email: String(payload.email || "").trim().toLowerCase(),
    phone: String(payload.phone || "").trim(),
    address: String(payload.address || "").trim(),
    taxId: String(payload.taxId || "").trim(),
    notes: String(payload.notes || "").trim(),
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
});

exports.getSuppliers = async (req, res) => {
    try {
        const { active = "" } = req.query;
        const query = {};
        if (active === "true") query.isActive = true;
        if (active === "false") query.isActive = false;

        const suppliers = await Supplier.find(query).sort({ name: 1 });
        return res.status(200).json({ suppliers });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.getSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        const purchaseOrders = await PurchaseOrder.find({ supplier: supplier._id })
            .select("purchaseOrderNumber status paymentStatus subtotal totalPaid balanceDue createdAt")
            .sort({ createdAt: -1 })
            .limit(20);

        return res.status(200).json({ supplier, purchaseOrders });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.createSupplier = async (req, res) => {
    try {
        const payload = normalizeSupplierPayload(req.body);
        if (!payload.name) {
            return res.status(400).json({ message: "Supplier name is required" });
        }

        const existing = await Supplier.findOne({ name: payload.name });
        if (existing) {
            return res.status(400).json({ message: "Supplier already exists" });
        }

        const supplier = await Supplier.create(payload);
        return res.status(201).json({ message: "Supplier created", supplier });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.updateSupplier = async (req, res) => {
    try {
        const payload = normalizeSupplierPayload(req.body);
        if (!payload.name) {
            return res.status(400).json({ message: "Supplier name is required" });
        }

        const duplicate = await Supplier.findOne({ name: payload.name, _id: { $ne: req.params.id } });
        if (duplicate) {
            return res.status(400).json({ message: "Supplier already exists" });
        }

        const supplier = await Supplier.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true,
        });

        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        return res.status(200).json({ message: "Supplier updated", supplier });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        const linkedPurchaseOrders = await PurchaseOrder.exists({ supplier: supplier._id });
        if (linkedPurchaseOrders) {
            supplier.isActive = false;
            await supplier.save();
            return res.status(200).json({ message: "Supplier deactivated because linked purchase orders exist", supplier });
        }

        await supplier.deleteOne();
        return res.status(200).json({ message: "Supplier deleted" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
