import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api, { withAuth } from "../../services/api";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";

const ReviewForm = ({ menuItemId, existingReview, onReviewSubmitted, onReviewDeleted, theme }) => {
  const { token } = useAuth();
  const { palette, resolvedMode } = useResolvedColorMode(theme || {
    colorMode: "system",
    allowUserThemeToggle: true,
    surfaceColor: "#f8fafc",
  });
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const highlightOptions = ["Fresh", "Tasty", "Good Value", "Quick Service", "Authentic", "Unique Flavor"];
  const isEditing = Boolean(existingReview?._id);

  useEffect(() => {
    if (!existingReview) {
      setRating(5);
      setTitle("");
      setComment("");
      setHighlights([]);
      return;
    }

    setRating(Number(existingReview.rating || 5));
    setTitle(existingReview.title || "");
    setComment(existingReview.comment || "");
    setHighlights(Array.isArray(existingReview.highlights) ? existingReview.highlights : []);
  }, [existingReview]);

  const handleHighlightToggle = (highlight) => {
    setHighlights((prev) =>
      prev.includes(highlight) ? prev.filter((item) => item !== highlight) : [...prev, highlight]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!rating || !comment.trim()) {
      setMessage("Please provide a rating and comment");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        menuItemId,
        rating: parseInt(rating, 10),
        title,
        comment,
        highlights,
      };

      const { data } = isEditing
        ? await api.put(`/reviews/${existingReview._id}`, payload, withAuth(token))
        : await api.post("/reviews", payload, withAuth(token));

      setMessage(data?.message || (isEditing ? "Review updated successfully" : "Review submitted successfully"));
      onReviewSubmitted?.();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to save review");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview?._id || !window.confirm("Delete your review for this food item?")) return;

    setLoading(true);
    try {
      const { data } = await api.delete(`/reviews/${existingReview._id}`, withAuth(token));
      setMessage(data?.message || "Review deleted successfully");
      onReviewDeleted?.();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to delete review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-elevated space-y-4 p-6" style={{ backgroundColor: palette.panelBg, color: palette.text }}>
      <h3 className="heading-4">{isEditing ? "Update Your Review" : "Share Your Review"}</h3>

      {message ? (
        <div
          className="rounded-lg p-3 text-sm"
          style={{
            backgroundColor: message.toLowerCase().includes("success")
              ? (resolvedMode === "dark" ? "#052e16" : "#dcfce7")
              : (resolvedMode === "dark" ? "#450a0a" : "#fee2e2"),
            color: message.toLowerCase().includes("success")
              ? (resolvedMode === "dark" ? "#86efac" : "#166534")
              : (resolvedMode === "dark" ? "#fca5a5" : "#991b1b"),
          }}
        >
          {message}
        </div>
      ) : null}

      <div>
        <label className="form-label">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setRating(num)}
              className="text-3xl transition-transform hover:scale-110"
              style={{ color: rating >= num ? "#facc15" : (resolvedMode === "dark" ? "#475569" : "#d1d5db") }}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label">Title (Optional)</label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g., Amazing taste!"
          className="input-base w-full"
          maxLength="100"
        />
      </div>

      <div>
        <label className="form-label">Your Review</label>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Share your experience with this dish..."
          className="input-base w-full"
          rows="4"
          maxLength="500"
          required
        />
        <p className="mt-1 text-xs" style={{ color: palette.muted }}>{comment.length}/500</p>
      </div>

      <div>
        <label className="form-label">Highlights (Optional)</label>
        <div className="flex flex-wrap gap-2">
          {highlightOptions.map((highlight) => (
            <button
              key={highlight}
              type="button"
              onClick={() => handleHighlightToggle(highlight)}
              className={`rounded-full px-3 py-1 text-sm transition-all ${highlights.includes(highlight) ? "text-white" : ""}`}
              style={highlights.includes(highlight)
                ? { backgroundColor: theme?.primaryColor || "#ff8c3a", color: "#fff" }
                : { backgroundColor: palette.cardBg, color: palette.text, border: `1px solid ${palette.border}` }}
            >
              {highlight}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1"
          style={{ background: theme?.primaryColor || "#ff8c3a" }}
        >
          {loading ? "Saving..." : isEditing ? "Update Review" : "Submit Review"}
        </button>
        {isEditing ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-xl border px-4 py-2 font-semibold"
            style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.cardBg }}
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
};

export default ReviewForm;
