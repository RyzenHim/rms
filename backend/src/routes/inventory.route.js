const express = require("express");
const inventoryController = require("../controllers/inventory.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");

const router = express.Router();

router.post("/", authenticate, authorizeRoles("admin", "manager"), inventoryController.createInventory);
router.get("/", authenticate, authorizeRoles("admin", "manager", "kitchen", "cashier"), inventoryController.getInventory);
router.get("/metadata", authenticate, authorizeRoles("admin", "manager", "kitchen", "cashier"), inventoryController.getMetadata);
router.get("/transactions", authenticate, authorizeRoles("admin", "manager", "kitchen", "cashier"), inventoryController.getInventoryTransactions);
router.post("/categories", authenticate, authorizeRoles("admin", "manager"), inventoryController.createCategory);
router.put("/categories/:id", authenticate, authorizeRoles("admin", "manager"), inventoryController.updateCategory);
router.delete("/categories/:id", authenticate, authorizeRoles("admin", "manager"), inventoryController.deleteCategory);
router.post("/units", authenticate, authorizeRoles("admin", "manager"), inventoryController.createUnit);
router.put("/units/:id", authenticate, authorizeRoles("admin", "manager"), inventoryController.updateUnit);
router.delete("/units/:id", authenticate, authorizeRoles("admin", "manager"), inventoryController.deleteUnit);
router.get("/item/:id", authenticate, authorizeRoles("admin", "manager", "kitchen", "cashier"), inventoryController.getInventoryItem);
router.put("/:id", authenticate, authorizeRoles("admin", "manager"), inventoryController.updateInventory);
router.patch("/:id/stock", authenticate, authorizeRoles("admin", "manager", "kitchen"), inventoryController.updateStock);
router.get("/low-stock", authenticate, authorizeRoles("admin", "manager", "kitchen", "cashier"), inventoryController.getLowStockItems);
router.delete("/:id", authenticate, authorizeRoles("admin", "manager"), inventoryController.deleteInventory);

module.exports = router;
