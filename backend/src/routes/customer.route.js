const router = require("express").Router();
const customerController = require("../controllers/customer.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");

// Admin routes for customer management
router.get("/", authenticate, authorizeRoles("admin", "manager"), customerController.getAllCustomers);
router.get("/stats", authenticate, authorizeRoles("admin", "manager"), customerController.getCustomerStats);
router.get("/:id", authenticate, authorizeRoles("admin", "manager"), customerController.getCustomerById);
router.put("/:id", authenticate, authorizeRoles("admin", "manager"), customerController.updateCustomer);
router.patch("/:id/status", authenticate, authorizeRoles("admin", "manager"), customerController.toggleCustomerStatus);
router.patch("/:id/restore", authenticate, authorizeRoles("admin", "manager"), customerController.restoreCustomer);
router.delete("/:id", authenticate, authorizeRoles("admin", "manager"), customerController.deleteCustomer);

module.exports = router;

