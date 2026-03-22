const express = require("express");
const stockRequestController = require("../controllers/stockRequest.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");

const router = express.Router();

router.get("/", authenticate, authorizeRoles("admin", "manager", "kitchen", "cashier"), stockRequestController.getStockRequests);
router.post("/", authenticate, authorizeRoles("admin", "manager", "kitchen"), stockRequestController.createStockRequest);
router.patch("/:id/approve", authenticate, authorizeRoles("admin", "manager"), stockRequestController.approveStockRequest);
router.patch("/:id/reject", authenticate, authorizeRoles("admin", "manager"), stockRequestController.rejectStockRequest);

module.exports = router;
