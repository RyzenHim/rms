const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");
const tableController = require("../controllers/table.controller");

// Public routes
router.get("/", tableController.getAllTables);
router.get("/available", tableController.getAvailableTables);
router.get("/:id", tableController.getTable);

// Admin only routes
router.post("/", authenticate, authorizeRoles("admin"), tableController.createTable);
router.put("/:id", authenticate, authorizeRoles("admin"), tableController.updateTable);
router.patch("/:id/status", authenticate, authorizeRoles("admin"), tableController.updateTableStatus);
router.delete("/:id", authenticate, authorizeRoles("admin"), tableController.deleteTable);
router.get("/stats/all", authenticate, authorizeRoles("admin"), tableController.getTableStats);

module.exports = router;
