const express = require("express");
const analyticsController = require("../controllers/analytics.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");

const router = express.Router();

// Admin only
router.get("/", authenticate, authorizeRoles("admin", "manager"), analyticsController.getAnalytics);

module.exports = router;
