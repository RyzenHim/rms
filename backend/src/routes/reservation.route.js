const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");
const reservationController = require("../controllers/reservation.controller");

// Customer routes (authenticated)
router.post("/", authenticate, authorizeRoles("customer"), reservationController.createReservation);
router.get("/my-reservations", authenticate, authorizeRoles("customer"), reservationController.getMyReservations);
router.patch("/:id", authenticate, authorizeRoles("customer", "admin"), reservationController.updateReservation);
router.patch("/:id/cancel", authenticate, authorizeRoles("customer", "admin"), reservationController.cancelReservation);

// Staff routes (check-in/out)
router.patch("/:id/checkin", authenticate, authorizeRoles("admin", "waiter"), reservationController.checkInReservation);
router.patch("/:id/checkout", authenticate, authorizeRoles("admin", "waiter"), reservationController.checkOutReservation);
router.patch("/:id/no-show", authenticate, authorizeRoles("admin"), reservationController.markNoShow);

// Admin routes
router.get("/", authenticate, authorizeRoles("admin"), reservationController.getAllReservations);
router.get("/stats", authenticate, authorizeRoles("admin"), reservationController.getReservationStats);
router.get("/:id", authenticate, authorizeRoles("admin", "customer"), reservationController.getReservation);

module.exports = router;
