const express = require("express");
const supplierController = require("../controllers/supplier.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");

const router = express.Router();

router.get("/", authenticate, authorizeRoles("admin", "manager", "cashier"), supplierController.getSuppliers);
router.get("/:id", authenticate, authorizeRoles("admin", "manager", "cashier"), supplierController.getSupplier);
router.post("/", authenticate, authorizeRoles("admin", "manager"), supplierController.createSupplier);
router.put("/:id", authenticate, authorizeRoles("admin", "manager"), supplierController.updateSupplier);
router.delete("/:id", authenticate, authorizeRoles("admin", "manager"), supplierController.deleteSupplier);

module.exports = router;
