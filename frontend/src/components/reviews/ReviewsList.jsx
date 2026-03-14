import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";
import { useAuth } from "../../context/AuthContext";
import { withAuth } from "../../services/api";

const ReviewsList = ({ menuItemId, theme, refreshTrigger }) => {
  const { token } = useAuth();
  const { palette, resolvedMode } = useResolvedColorMode(theme || {
    colorMode: "system",
    allowUserThemeToggle: true,
    surfaceColor: "#f8fafc",
  });
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingHelpfulId, setPendingHelpfulId] = useState("");

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

  const markHelpful = async (reviewId) => {
    try {
      setPendingHelpfulId(reviewId);
      await api.post(`/reviews/${reviewId}/helpful`, {}, token ? withAuth(token) : {});
      await loadReviews();
    } catch (err) {
      console.error("Failed to mark review helpful:", err);
    } finally {
      setPendingHelpfulId("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {stats && (
        <div className="card-elevated space-y-4 p-6" style={{ backgroundColor: palette.panelBg, color: palette.text }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-widest" style={{ color: palette.muted }}>Overall Rating</p>
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold" style={{ color: theme?.primaryColor }}>
                    {stats.averageRating}
                  </span>
                  <span className="text-lg text-yellow-400"></span>
                </div>
                <div className="text-sm" style={{ color: palette.muted }}>
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
                <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: resolvedMode === "dark" ? "#334155" : "#e2e8f0" }}>
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${stats.totalReviews > 0 ? (stats.distribution[rating] / stats.totalReviews) * 100 : 0}%`,
                      backgroundColor: theme?.primaryColor || "#ff8c3a",
                    }}
                  />
                </div>
                <span className="w-12 text-right text-sm" style={{ color: palette.muted }}>{stats.distribution[rating]}</span>
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
          <p style={{ color: palette.muted }}>Loading reviews...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="card-elevated space-y-3 p-5" style={{ backgroundColor: palette.panelBg, color: palette.text }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold" style={{ color: palette.text }}>{review.customer.name}</span>
                    {review.isVerifiedPurchase && <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: resolvedMode === "dark" ? "#052e16" : "#dcfce7", color: resolvedMode === "dark" ? "#86efac" : "#166534" }}> Verified Purchase</span>}
                  </div>
                  <div className={`flex items-center gap-1 ${getRatingColor(review.rating)}`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < review.rating ? "★" : "☆"}</span>
                    ))}
                    <span className="ml-2 text-sm font-medium" style={{ color: palette.muted }}>{review.rating} out of 5</span>
                  </div>
                </div>
                <span className="text-xs" style={{ color: palette.muted }}>{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>

              {review.title && <p className="font-semibold" style={{ color: palette.text }}>{review.title}</p>}
              <p style={{ color: palette.text }}>{review.comment}</p>

              {review.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {review.highlights.map((highlight) => (
                    <span key={highlight} className="rounded px-2 py-1 text-xs" style={{ backgroundColor: palette.cardBg, color: palette.text, border: `1px solid ${palette.border}` }}>
                      {highlight}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 pt-2 text-sm">
                <button
                  onClick={() => markHelpful(review._id)}
                  disabled={pendingHelpfulId === review._id}
                  className="flex items-center gap-1 disabled:opacity-60"
                  style={{ color: palette.muted }}
                >
                  {pendingHelpfulId === review._id ? "Updating..." : `Helpful (${review.helpful})`}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-elevated p-8 text-center">
          <p style={{ color: palette.muted }}>No reviews yet. Be the first to share your experience!</p>
        </div>
      )}

      {/* Pagination */}
      {stats && stats.totalReviews > 5 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border px-4 py-2 disabled:opacity-50"
            style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.cardBg }}
          >
            Previous
          </button>
          <span className="px-4 py-2" style={{ color: palette.muted }}>Page {currentPage}</span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage * 5 >= stats.totalReviews}
            className="rounded-lg border px-4 py-2 disabled:opacity-50"
            style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.cardBg }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
