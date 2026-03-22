const StockRequest = require("../models/stockRequest.model");
const PurchaseOrder = require("../models/purchaseOrder.model");
const Supplier = require("../models/supplier.model");
const Inventory = require("../models/inventory.model");

const getStockRequestNumber = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SR-${y}${m}${d}-${rand}`;
};

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

const buildAuditEntry = (req, action, note = "") => ({
  action,
  note: String(note || "").trim(),
  actor: req.user?._id || null,
  actorRoles: req.user?.roles || [],
  createdAt: new Date(),
});

exports.getStockRequests = async (req, res) => {
  try {
    const { status = "" } = req.query;
    const query = {};
    if (status) query.status = status;

    const roles = req.user.roles || [];
    if (roles.includes("kitchen") && !roles.includes("admin") && !roles.includes("manager")) {
      query.requestedBy = req.user._id;
    }

    const stockRequests = await StockRequest.find(query)
      .populate("requestedBy", "name roles")
      .populate("approvedBy", "name roles")
      .populate("rejectedBy", "name roles")
      .populate("linkedPurchaseOrder", "purchaseOrderNumber status paymentStatus totalPaid balanceDue")
      .populate("auditTrail.actor", "name roles")
      .sort({ createdAt: -1 });

    return res.status(200).json({ stockRequests });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createStockRequest = async (req, res) => {
  try {
    const payloadItems = Array.isArray(req.body.items) ? req.body.items : [];
    if (!payloadItems.length) {
      return res.status(400).json({ message: "Stock request must include at least one item" });
    }

    const inventoryIds = payloadItems.map((item) => item.inventoryItem).filter(Boolean);
    const inventoryItems = await Inventory.find({ _id: { $in: inventoryIds }, isActive: true });
    const inventoryMap = new Map(inventoryItems.map((item) => [String(item._id), item]));

    if (inventoryItems.length !== inventoryIds.length) {
      return res.status(400).json({ message: "One or more inventory items are invalid or inactive" });
    }

    const items = payloadItems.map((item) => {
      const inventoryItem = inventoryMap.get(String(item.inventoryItem));
      const requestedQuantity = toNumber(item.requestedQuantity, NaN);
      if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
        throw new Error(`Requested quantity is required for ${inventoryItem.name}`);
      }
      return {
        inventoryItem: inventoryItem._id,
        itemName: inventoryItem.name,
        category: inventoryItem.category,
        unit: inventoryItem.unit,
        requestedQuantity,
        notes: String(item.notes || "").trim(),
      };
    });

    const stockRequest = await StockRequest.create({
      requestNumber: getStockRequestNumber(),
      items,
      justification: String(req.body.justification || "").trim(),
      priority: ["low", "normal", "high", "urgent"].includes(req.body.priority) ? req.body.priority : "normal",
      requestedBy: req.user._id,
      auditTrail: [buildAuditEntry(req, "request_created", "Stock request submitted")],
    });

    const populated = await StockRequest.findById(stockRequest._id)
      .populate("requestedBy", "name roles")
      .populate("auditTrail.actor", "name roles");

    return res.status(201).json({ message: "Stock request created", stockRequest: populated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.approveStockRequest = async (req, res) => {
  try {
    const stockRequest = await StockRequest.findById(req.params.id);
    if (!stockRequest) {
      return res.status(404).json({ message: "Stock request not found" });
    }
    if (stockRequest.status !== "pending") {
      return res.status(400).json({ message: "Only pending stock requests can be approved" });
    }

    const supplier = await Supplier.findOne({ _id: req.body.supplier, isActive: true });
    if (!supplier) {
      return res.status(400).json({ message: "Valid active supplier is required for approval" });
    }

    const approvalItems = Array.isArray(req.body.items) ? req.body.items : [];
    if (!approvalItems.length) {
      return res.status(400).json({ message: "Approved purchase lines are required" });
    }

    const requestItemMap = new Map(stockRequest.items.map((item) => [String(item.inventoryItem), item]));
    const normalizedItems = approvalItems.map((item) => {
      const requestItem = requestItemMap.get(String(item.inventoryItem));
      if (!requestItem) {
        throw new Error("Approved item does not exist in the stock request");
      }

      const orderedQuantity = toNumber(item.orderedQuantity, NaN);
      const unitPrice = toNumber(item.unitPrice, NaN);
      if (!Number.isFinite(orderedQuantity) || orderedQuantity <= 0) {
        throw new Error(`Ordered quantity is required for ${requestItem.itemName}`);
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error(`Unit price is required for ${requestItem.itemName}`);
      }

      return {
        inventoryItem: requestItem.inventoryItem,
        itemName: requestItem.itemName,
        category: requestItem.category,
        unit: requestItem.unit,
        orderedQuantity,
        receivedQuantity: 0,
        unitPrice,
        lineTotal: Number((orderedQuantity * unitPrice).toFixed(2)),
        notes: String(item.notes || requestItem.notes || "").trim(),
      };
    });

    const subtotal = Number(normalizedItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0).toFixed(2));
    const purchaseOrder = await PurchaseOrder.create({
      purchaseOrderNumber: getPurchaseOrderNumber(),
      supplier: supplier._id,
      sourceRequest: stockRequest._id,
      items: normalizedItems,
      status: "ordered",
      paymentStatus: "unpaid",
      subtotal,
      totalPaid: 0,
      balanceDue: subtotal,
      notes: String(req.body.notes || stockRequest.justification || "").trim(),
      expectedDeliveryDate: req.body.expectedDeliveryDate || null,
      orderedAt: new Date(),
      createdBy: req.user._id,
      auditTrail: [
        buildAuditEntry(req, "purchase_order_created", `Created from stock request ${stockRequest.requestNumber}`),
      ],
    });

    stockRequest.status = "converted";
    stockRequest.approvedBy = req.user._id;
    stockRequest.approvedAt = new Date();
    stockRequest.managerNote = String(req.body.managerNote || "").trim();
    stockRequest.linkedPurchaseOrder = purchaseOrder._id;
    stockRequest.auditTrail.push(buildAuditEntry(req, "request_approved", `Approved and converted into ${purchaseOrder.purchaseOrderNumber}`));
    await stockRequest.save();

    const populated = await StockRequest.findById(stockRequest._id)
      .populate("requestedBy", "name roles")
      .populate("approvedBy", "name roles")
      .populate("linkedPurchaseOrder", "purchaseOrderNumber status paymentStatus totalPaid balanceDue")
      .populate("auditTrail.actor", "name roles");

    return res.status(200).json({ message: "Stock request approved and purchase order created", stockRequest: populated, purchaseOrder });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.rejectStockRequest = async (req, res) => {
  try {
    const stockRequest = await StockRequest.findById(req.params.id);
    if (!stockRequest) {
      return res.status(404).json({ message: "Stock request not found" });
    }
    if (stockRequest.status !== "pending") {
      return res.status(400).json({ message: "Only pending stock requests can be rejected" });
    }

    stockRequest.status = "rejected";
    stockRequest.rejectedBy = req.user._id;
    stockRequest.rejectedAt = new Date();
    stockRequest.managerNote = String(req.body.managerNote || "").trim();
    stockRequest.auditTrail.push(buildAuditEntry(req, "request_rejected", stockRequest.managerNote || "Request rejected"));
    await stockRequest.save();

    const populated = await StockRequest.findById(stockRequest._id)
      .populate("requestedBy", "name roles")
      .populate("rejectedBy", "name roles")
      .populate("auditTrail.actor", "name roles");

    return res.status(200).json({ message: "Stock request rejected", stockRequest: populated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
