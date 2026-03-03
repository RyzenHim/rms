const Review = require("../models/review.model");
const MenuItem = require("../models/menuItem.model");
const Customer = require("../models/customer.model");

const getCustomerFromRequest = async (req) =>
  Customer.findOne({
    user: req.user._id,
    restaurant: req.restaurant._id,
  });

// Create review
exports.createReview = async (req, res) => {
  try {
    const { menuItemId, rating, title, comment, highlights, images } = req.body;
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Validate
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Check if menu item exists
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Check if customer already reviewed this item
    const existingReview = await Review.findOne({
      restaurant: req.restaurant._id,
      menuItem: menuItemId,
      customer: customer._id,
    });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this item" });
    }

    const review = await Review.create({
      restaurant: req.restaurant._id,
      menuItem: menuItemId,
      customer: customer._id,
      rating,
      title: title || "",
      comment: comment || "",
      highlights: highlights || [],
      images: images || [],
    });

    const populatedReview = await review.populate("customer", "name");
    res.status(201).json({ message: "Review created successfully", review: populatedReview });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get reviews for a menu item
exports.getMenuItemReviews = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { page = 1, limit = 10, sortBy = "newest" } = req.query;

    const skip = (page - 1) * limit;
    let sortOption = { createdAt: -1 };

    if (sortBy === "highest") sortOption = { rating: -1, createdAt: -1 };
    if (sortBy === "lowest") sortOption = { rating: 1, createdAt: -1 };
    if (sortBy === "helpful") sortOption = { helpful: -1, createdAt: -1 };

    const reviews = await Review.find({
      restaurant: req.restaurant._id,
      menuItem: menuItemId,
      status: "approved",
    })
      .populate("customer", "name")
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({
      restaurant: req.restaurant._id,
      menuItem: menuItemId,
      status: "approved",
    });

    // Calculate average rating
    const ratingData = await Review.aggregate([
      {
        $match: {
          restaurant: req.restaurant._id,
          menuItem: require("mongoose").Types.ObjectId(menuItemId),
          status: "approved",
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating",
          },
        },
      },
    ]);

    let stats = {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };

    if (ratingData.length > 0) {
      stats.averageRating = ratingData[0].averageRating.toFixed(1);
      stats.totalReviews = ratingData[0].totalReviews;
      ratingData[0].ratingDistribution.forEach((rating) => {
        stats.distribution[rating]++;
      });
    }

    res.status(200).json({ reviews, pagination: { total, page: parseInt(page), limit: parseInt(limit) }, stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const customer = await getCustomerFromRequest(req);
    const { rating, title, comment, highlights } = req.body;

    const review = await Review.findOne({
      _id: reviewId,
      restaurant: req.restaurant._id,
    });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (!customer || review.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own reviews" });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    review.rating = rating || review.rating;
    review.title = title !== undefined ? title : review.title;
    review.comment = comment !== undefined ? comment : review.comment;
    review.highlights = highlights || review.highlights;

    await review.save();
    const updated = await review.populate("customer", "name");

    res.status(200).json({ message: "Review updated successfully", review: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const customer = await getCustomerFromRequest(req);

    const review = await Review.findOne({
      _id: reviewId,
      restaurant: req.restaurant._id,
    });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (
      req.user.roles[0] !== "admin" &&
      (!customer || review.customer.toString() !== customer._id.toString())
    ) {
      return res.status(403).json({ message: "You can only delete your own reviews" });
    }

    await Review.findOneAndDelete({ _id: reviewId, restaurant: req.restaurant._id });
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get customer's reviews
exports.getCustomerReviews = async (req, res) => {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const reviews = await Review.find({
      restaurant: req.restaurant._id,
      customer: customer._id,
    })
      .populate("menuItem", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOneAndUpdate(
      { _id: reviewId, restaurant: req.restaurant._id },
      { $inc: { helpful: 1 } },
      { new: true }
    );

    res.status(200).json({ message: "Marked as helpful", review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
