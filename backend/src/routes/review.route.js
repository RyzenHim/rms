const express = require("express");
const reviewController = require("../controllers/review.controller");
const { authenticate } = require("../middlewares/authenticate");

const router = express.Router();

// Public routes
router.get("/item/:menuItemId", reviewController.getMenuItemReviews);

// Protected routes (customer)
router.post("/", authenticate, reviewController.createReview);
router.get("/my-reviews", authenticate, reviewController.getCustomerReviews);
router.put("/:reviewId", authenticate, reviewController.updateReview);
router.delete("/:reviewId", authenticate, reviewController.deleteReview);
router.post("/:reviewId/helpful", authenticate, reviewController.markHelpful);

module.exports = router;
