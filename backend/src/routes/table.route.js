const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");
const tableController = require("../controllers/table.controller");

// Public routes
router.get("/", tableController.getAllTables);
router.get("/available", tableController.getAvailableTables);

// Admin only routes
router.get("/qr-links", authenticate, authorizeRoles("admin"), tableController.getTableQrLinks);
router.get("/stats/all", authenticate, authorizeRoles("admin"), tableController.getTableStats);
router.post("/", authenticate, authorizeRoles("admin"), tableController.createTable);
router.put("/:id", authenticate, authorizeRoles("admin"), tableController.updateTable);
router.patch("/:id/status", authenticate, authorizeRoles("admin"), tableController.updateTableStatus);
router.delete("/:id", authenticate, authorizeRoles("admin"), tableController.deleteTable);

// Keep this route last so it doesn't shadow fixed paths like /stats/all
router.get("/:id", tableController.getTable);

module.exports = router;
