const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const reviewService = {
  // Get reviews for a menu item
  getMenuItemReviews: async (menuItemId, page = 1, limit = 10, sortBy = "newest") => {
    const response = await fetch(`${API_URL}/reviews/item/${menuItemId}?page=${page}&limit=${limit}&sortBy=${sortBy}`);
    if (!response.ok) throw new Error("Failed to fetch reviews");
    return response.json();
  },

  // Create review
  createReview: async (menuItemId, reviewData, token) => {
    const response = await fetch(`${API_URL}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ menuItemId, ...reviewData }),
    });
    if (!response.ok) throw new Error("Failed to create review");
    return response.json();
  },

  // Get customer's reviews
  getMyReviews: async (token) => {
    const response = await fetch(`${API_URL}/reviews/my-reviews`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch reviews");
    return response.json();
  },

  // Update review
  updateReview: async (reviewId, reviewData, token) => {
    const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reviewData),
    });
    if (!response.ok) throw new Error("Failed to update review");
    return response.json();
  },

  // Delete review
  deleteReview: async (reviewId, token) => {
    const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to delete review");
    return response.json();
  },

  // Mark as helpful
  markHelpful: async (reviewId, token) => {
    const response = await fetch(`${API_URL}/reviews/${reviewId}/helpful`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to mark as helpful");
    return response.json();
  },
};

export default reviewService;
