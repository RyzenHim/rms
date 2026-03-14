import { useState } from "react";
import { FiClock, FiMessageSquare, FiShoppingCart, FiStar, FiTag } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import AppModal from "../modals/AppModal";
import ReviewForm from "../reviews/ReviewForm";
import ReviewsList from "../reviews/ReviewsList";
import { useAuth } from "../../context/AuthContext";

const MenuItemQuickViewModal = ({
  item,
  isOpen,
  onClose,
  palette,
  theme,
  onAddToCart,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [refreshToken, setRefreshToken] = useState(0);

  if (!item) return null;

  const canReview = isAuthenticated && user?.roles?.includes("customer");

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={item.name}
      maxWidth="max-w-5xl"
    >
      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-4">
          <div className="overflow-hidden rounded-[1.8rem] border" style={{ backgroundColor: palette.cardBg, borderColor: palette.border, boxShadow: palette.glassShadow }}>
            <img
              src={item.image || "https://via.placeholder.com/900x640?text=Dish"}
              alt={item.name}
              className="h-72 w-full object-cover sm:h-80"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border p-4" style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: palette.muted }}>Rating</p>
              <p className="mt-1 inline-flex items-center gap-2 text-lg font-black" style={{ color: palette.text }}>
                <FiStar className="h-4 w-4 text-amber-400" />
                {Number(item.averageRating || item.rating || 0).toFixed(1)}
              </p>
              <p className="text-xs" style={{ color: palette.muted }}>{Number(item.reviewCount || 0)} customer reviews</p>
            </div>
            <div className="rounded-[1.4rem] border p-4" style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: palette.muted }}>Prep Time</p>
              <p className="mt-1 inline-flex items-center gap-2 text-lg font-black" style={{ color: palette.text }}>
                <FiClock className="h-4 w-4" />
                {Number(item.prepTimeMinutes || 0)} min
              </p>
              <p className="text-xs" style={{ color: palette.muted }}>{String(item.spiceLevel || "none").replaceAll("_", " ")}</p>
            </div>
            <div className="rounded-[1.4rem] border p-4" style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: palette.muted }}>Category</p>
              <p className="mt-1 text-lg font-black" style={{ color: palette.text }}>{item.category?.name || "Menu Item"}</p>
              <p className="text-xs" style={{ color: palette.muted }}>{item.subCategory?.name || "Chef curated selection"}</p>
            </div>
          </div>

          <ReviewsList menuItemId={item._id} theme={theme} refreshTrigger={`${item._id}-${refreshToken}`} />
        </section>

        <aside className="space-y-4">
          <section className="rounded-[1.9rem] border p-5" style={{ borderColor: palette.border, backgroundColor: palette.cardBg, boxShadow: palette.glassShadow }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: palette.muted }}>
                  {item.heading || item.category?.name || "Signature Dish"}
                </p>
                <h3 className="mt-1 text-2xl font-black" style={{ color: palette.text }}>{item.name}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: palette.muted }}>
                  {item.description || item.shortDescription}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black" style={{ color: theme?.primaryColor || palette.primary }}>
                  Rs {Number(item.price || 0).toFixed(2)}
                </p>
                {Number(item.compareAtPrice || 0) > Number(item.price || 0) ? (
                  <p className="text-sm line-through" style={{ color: palette.muted }}>
                    Rs {Number(item.compareAtPrice || 0).toFixed(2)}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: palette.border, color: palette.text }}>
                {item.foodType === "veg" ? "Veg" : "Non-Veg"}
              </span>
              <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: palette.border, color: palette.text }}>
                {String(item.stockStatus || "in_stock").replaceAll("_", " ")}
              </span>
              {item.discountLabel ? (
                <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: theme?.primaryColor || palette.primary }}>
                  {item.discountLabel}
                </span>
              ) : null}
            </div>

            {item.dietaryTags?.length ? (
              <div className="mt-4">
                <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.muted }}>
                  <FiTag className="h-3.5 w-3.5" />
                  Dietary Notes
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.dietaryTags.map((tag) => (
                    <span key={tag} className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: palette.border, color: palette.text }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {item.portions?.length ? (
              <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}>
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.muted }}>Available Portions</p>
                <div className="mt-3 space-y-2">
                  {item.portions.map((portion) => (
                    <div key={`${item._id}-${portion.label}`} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ backgroundColor: palette.cardBg }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: palette.text }}>{portion.label}</p>
                        <p className="text-xs" style={{ color: palette.muted }}>{portion.quantityText || "Standard serve"}</p>
                      </div>
                      <p className="text-sm font-black" style={{ color: theme?.primaryColor || palette.primary }}>
                        Rs {Number(portion.price || 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <button
              onClick={() => onAddToCart?.(item)}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white"
              style={{ backgroundColor: theme?.primaryColor || palette.primary }}
            >
              <FiShoppingCart className="h-4 w-4" />
              Add To Order Tray
            </button>
          </section>

          <section className="rounded-[1.9rem] border p-5" style={{ borderColor: palette.border, backgroundColor: palette.cardBg, boxShadow: palette.glassShadow }}>
            <div className="mb-3 flex items-center gap-2">
              <FiMessageSquare className="h-4 w-4" style={{ color: theme?.primaryColor || palette.primary }} />
              <p className="text-sm font-black" style={{ color: palette.text }}>Customer Feedback</p>
            </div>
            {canReview ? (
              <ReviewForm
                menuItemId={item._id}
                theme={theme}
                onReviewSubmitted={() => setRefreshToken((prev) => prev + 1)}
              />
            ) : (
              <div className="rounded-2xl border p-4 text-sm" style={{ borderColor: palette.border, backgroundColor: palette.panelBg, color: palette.muted }}>
                Sign in as a customer to add ratings and comments for this dish.
                <button
                  onClick={() => navigate("/auth/login")}
                  className="mt-3 inline-flex rounded-xl px-4 py-2 font-semibold text-white"
                  style={{ backgroundColor: theme?.primaryColor || palette.primary }}
                >
                  Login To Review
                </button>
              </div>
            )}
          </section>
        </aside>
      </div>
    </AppModal>
  );
};

export default MenuItemQuickViewModal;
