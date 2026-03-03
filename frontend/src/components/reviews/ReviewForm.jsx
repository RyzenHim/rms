import { useState } from "react";

const ReviewForm = ({ menuItemId, onReviewSubmitted, theme }) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const highlightOptions = ["Fresh", "Tasty", "Good Value", "Quick Service", "Authentic", "Unique Flavor"];

  const handleHighlightToggle = (highlight) => {
    setHighlights((prev) =>
      prev.includes(highlight) ? prev.filter((h) => h !== highlight) : [...prev, highlight]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !comment.trim()) {
      setMessage("Please provide a rating and comment");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          menuItemId,
          rating: parseInt(rating),
          title,
          comment,
          highlights,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Review submitted successfully!");
        setRating(5);
        setTitle("");
        setComment("");
        setHighlights([]);
        if (onReviewSubmitted) onReviewSubmitted();
      } else {
        setMessage(data.message || "Failed to submit review");
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-elevated p-6 space-y-4">
      <h3 className="heading-4">Share Your Review</h3>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.includes("successfully") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message}
        </div>
      )}

      <div>
        <label className="form-label">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setRating(num)}
              className={`text-3xl transition-transform hover:scale-110 ${rating >= num ? "text-yellow-400" : "text-gray-300"}`}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label">Title (Optional)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Amazing taste!"
          className="input-base w-full"
          maxLength="100"
        />
      </div>

      <div>
        <label className="form-label">Your Review</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this dish..."
          className="input-base w-full"
          rows="4"
          maxLength="500"
          required
        />
        <p className="text-xs text-slate-500 mt-1">{comment.length}/500</p>
      </div>

      <div>
        <label className="form-label">Highlights (Optional)</label>
        <div className="flex flex-wrap gap-2">
          {highlightOptions.map((highlight) => (
            <button
              key={highlight}
              type="button"
              onClick={() => handleHighlightToggle(highlight)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                highlights.includes(highlight)
                  ? "bg-orange-500 text-white"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {highlight}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
        style={{ background: theme?.primaryColor || "#ff8c3a" }}
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
};

export default ReviewForm;
