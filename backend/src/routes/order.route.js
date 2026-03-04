const router = require("express").Router();
const { getOrders, createOrder, updateOrderStatus, updatePaymentStatus, cancelMyOrder } = require("../controllers/order.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");

router.get(
    "/",
    authenticate,
    authorizeRoles("waiter", "kitchen", "admin", "manager", "cashier", "customer"),
    getOrders
);
router.post(
    "/",
    authenticate,
    authorizeRoles("waiter", "admin", "manager", "customer"),
    createOrder
);
router.patch(
    "/:id/status",
    authenticate,
    authorizeRoles("waiter", "kitchen", "admin", "manager"),
    updateOrderStatus
);
router.patch(
    "/:id/payment",
    authenticate,
    authorizeRoles("cashier", "admin", "manager"),
    updatePaymentStatus
);
router.patch(
    "/:id/cancel",
    authenticate,
    authorizeRoles("customer"),
    cancelMyOrder
);

module.exports = router;
