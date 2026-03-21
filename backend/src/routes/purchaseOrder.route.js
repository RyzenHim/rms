const express = require("express");
const purchaseOrderController = require("../controllers/purchaseOrder.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");

const router = express.Router();

router.get("/", authenticate, authorizeRoles("admin", "manager", "cashier", "kitchen"), purchaseOrderController.getPurchaseOrders);
router.get("/:id", authenticate, authorizeRoles("admin", "manager", "cashier", "kitchen"), purchaseOrderController.getPurchaseOrder);
router.post("/", authenticate, authorizeRoles("admin", "manager"), purchaseOrderController.createPurchaseOrder);
router.put("/:id", authenticate, authorizeRoles("admin", "manager"), purchaseOrderController.updatePurchaseOrder);
router.patch("/:id/payments", authenticate, authorizeRoles("admin", "manager", "cashier"), purchaseOrderController.recordPurchasePayment);
router.patch("/:id/receive", authenticate, authorizeRoles("admin", "manager"), purchaseOrderController.receivePurchaseOrderItems);
router.delete("/:id", authenticate, authorizeRoles("admin", "manager"), purchaseOrderController.deletePurchaseOrder);

module.exports = router;
