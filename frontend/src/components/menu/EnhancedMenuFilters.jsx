import { useState } from "react";

const EnhancedMenuFilters = ({ onFilterChange, items, theme }) => {
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [isVegetarian, setIsVegetarian] = useState(null);
  const [sortBy, setSortBy] = useState("featured");

  const maxPrice = Math.max(...items.map((item) => item.price || 0), 1000);

  const handleFilterChange = () => {
    onFilterChange({
      priceRange,
      minRating,
      isVegetarian,
      sortBy,
    });
  };

  const handlePriceChange = (e) => {
    const value = parseInt(e.target.value);
    setPriceRange([0, value]);
    setTimeout(handleFilterChange, 100);
  };

  const handleRatingChange = (rating) => {
    setMinRating(minRating === rating ? 0 : rating);
    setTimeout(handleFilterChange, 100);
  };

  const handleVegetarianChange = (value) => {
    setIsVegetarian(isVegetarian === value ? null : value);
    setTimeout(handleFilterChange, 100);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    onFilterChange({
      priceRange,
      minRating,
      isVegetarian,
      sortBy: value,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="form-label flex items-center justify-between mb-3">
          <span> Price Range</span>
          <span className="text-sm font-semibold">₹{priceRange[0]} - ₹{priceRange[1]}</span>
        </label>
        <input
          type="range"
          min="0"
          max={maxPrice}
          value={priceRange[1]}
          onChange={handlePriceChange}
          className="w-full"
        />
      </div>

      <div>
        <label className="form-label mb-3">⭐ Minimum Rating</label>
        <div className="space-y-2">
          {[5, 4, 3].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingChange(rating)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                minRating === rating
                  ? "bg-yellow-100 text-yellow-900 border-2"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-sm">
                  {i < rating ? "" : ""}
                </span>
              ))}{" "}
              <span className="text-sm ml-2">{rating}+ Stars</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label mb-3"> Dietary Preference</label>
        <div className="space-y-2">
          <button
            onClick={() => handleVegetarianChange("veg")}
            className={`w-full px-3 py-2 rounded-lg transition-all text-left ${
              isVegetarian === "veg"
                ? "bg-green-100 text-green-900 border-2"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
             Vegetarian
          </button>
          <button
            onClick={() => handleVegetarianChange("non_veg")}
            className={`w-full px-3 py-2 rounded-lg transition-all text-left ${
              isVegetarian === "non_veg"
                ? "bg-orange-100 text-orange-900 border-2"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
             Non-Vegetarian
          </button>
        </div>
      </div>

      <div>
        <label className="form-label mb-3"> Sort By</label>
        <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)} className="input-base w-full">
          <option value="featured">⭐ Featured</option>
          <option value="price-asc"> Price: Low to High</option>
          <option value="price-desc"> Price: High to Low</option>
          <option value="rating">⭐ Highest Rated</option>
          <option value="newest"> Newest</option>
          <option value="most-reviewed"> Most Reviewed</option>
        </select>
      </div>

      <button
        onClick={() => {
          setPriceRange([0, maxPrice]);
          setMinRating(0);
          setIsVegetarian(null);
          setSortBy("featured");
          onFilterChange({
            priceRange: [0, maxPrice],
            minRating: 0,
            isVegetarian: null,
            sortBy: "featured",
          });
        }}
        className="w-full btn-outline"
      >
         Reset Filters
      </button>
    </div>
  );
};

export default EnhancedMenuFilters;
