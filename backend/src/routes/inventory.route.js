const express = require("express");
const inventoryController = require("../controllers/inventory.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");

const router = express.Router();

// Admin only routes
router.post("/", authenticate, authorizeRoles("admin", "manager"), inventoryController.createInventory);
router.get("/", authenticate, authorizeRoles("admin", "manager"), inventoryController.getInventory);
router.get("/item/:id", authenticate, authorizeRoles("admin", "manager"), inventoryController.getInventoryItem);
router.put("/:id", authenticate, authorizeRoles("admin", "manager"), inventoryController.updateInventory);
router.patch("/:id/stock", authenticate, authorizeRoles("admin", "manager"), inventoryController.updateStock);
router.get("/low-stock", authenticate, authorizeRoles("admin", "manager"), inventoryController.getLowStockItems);
router.delete("/:id", authenticate, authorizeRoles("admin", "manager"), inventoryController.deleteInventory);
router.get("/categories", authenticate, authorizeRoles("admin", "manager"), inventoryController.getCategories);

module.exports = router;
