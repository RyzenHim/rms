import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

const ReviewsList = ({ menuItemId, theme, refreshTrigger }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/reviews/item/${menuItemId}`, {
        params: { page: currentPage, limit: 5, sortBy },
      });
      setReviews(data.reviews);
      setStats(data.stats);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, menuItemId, sortBy]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews, refreshTrigger]);

  const getRatingColor = (rating) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {stats && (
        <div className="card-elevated p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600 uppercase tracking-widest font-bold mb-2">Overall Rating</p>
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold" style={{ color: theme?.primaryColor }}>
                    {stats.averageRating}
                  </span>
                  <span className="text-lg text-yellow-400"></span>
                </div>
                <div className="text-sm text-slate-600">
                  <p className="font-semibold">{stats.totalReviews} reviews</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm font-medium w-8">{rating}</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${stats.totalReviews > 0 ? (stats.distribution[rating] / stats.totalReviews) * 100 : 0}%`,
                      backgroundColor: theme?.primaryColor || "#ff8c3a",
                    }}
                  />
                </div>
                <span className="text-sm text-slate-600 w-12 text-right">{stats.distribution[rating]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <h3 className="heading-4">Customer Reviews</h3>
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setCurrentPage(1);
          }}
          className="input-base text-sm"
        >
          <option value="newest">Newest First</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
          <option value="helpful">Most Helpful</option>
        </select>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-slate-600">Loading reviews...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="card-elevated p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900">{review.customer.name}</span>
                    {review.isVerifiedPurchase && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full"> Verified Purchase</span>}
                  </div>
                  <div className={`flex items-center gap-1 ${getRatingColor(review.rating)}`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < review.rating ? "" : ""}</span>
                    ))}
                    <span className="text-sm text-slate-600 ml-2 font-medium">{review.rating} out of 5</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>

              {review.title && <p className="font-semibold text-slate-900">{review.title}</p>}
              <p className="text-slate-700">{review.comment}</p>

              {review.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {review.highlights.map((highlight) => (
                    <span key={highlight} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {highlight}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 pt-2 text-sm">
                <button className="text-slate-600 hover:text-slate-900 flex items-center gap-1">
                   Helpful ({review.helpful})
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-elevated p-8 text-center">
          <p className="text-slate-600">No reviews yet. Be the first to share your experience!</p>
        </div>
      )}

      {/* Pagination */}
      {stats && stats.totalReviews > 5 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-slate-600">Page {currentPage}</span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage * 5 >= stats.totalReviews}
            className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
