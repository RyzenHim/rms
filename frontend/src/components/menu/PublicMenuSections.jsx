import { useMemo } from "react";

const sorters = {
  featured: (a, b) => Number(b.isFeatured) - Number(a.isFeatured),
  "price-asc": (a, b) => Number(a.price || 0) - Number(b.price || 0),
  "price-desc": (a, b) => Number(b.price || 0) - Number(a.price || 0),
  newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
};
const FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="800" height="500" fill="url(#g)"/>
    <g fill="#ffffff" fill-opacity="0.9" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
      <text x="400" y="245" font-size="32" font-weight="700">Menu Item</text>
      <text x="400" y="285" font-size="18">Image not available</text>
    </g>
  </svg>`,
)}`;

const PublicMenuSections = ({
  categories = [],
  subCategories = [],
  items = [],
  primaryColor = "#0b6b49",
  isCustomerView = false,
  search = "",
  selectedCategory = "",
  selectedSubCategory = "",
  selectedFoodType = "",
  sortBy = "featured",
  palette = {},
  onAddToCart,
  onIncrementItem,
  onDecrementItem,
  onRemoveItem,
  onItemTap,
  cartItems = [],
  showTrayActions = false,
  onGoToTray,
}) => {
  const softPrimary = `${primaryColor}14`;
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [categories],
  );

  const sortedSubCategories = useMemo(
    () => [...subCategories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [subCategories],
  );

  const normalizedSearch = search.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    const sorter = sorters[sortBy] || sorters.featured;
    return [...items]
      .filter((item) => {
        const categoryId = item?.category?._id || item?.category;
        const subCategoryId = item?.subCategory?._id || item?.subCategory;
        const haystack = [
          item?.name,
          item?.heading,
          item?.subHeading,
          item?.description,
          item?.shortDescription,
          item?.category?.name,
          item?.subCategory?.name,
        ]
          .join(" ")
          .toLowerCase();

        const categoryMatch = !selectedCategory || categoryId === selectedCategory;
        const subCategoryMatch = !selectedSubCategory || subCategoryId === selectedSubCategory;
        const searchMatch = !normalizedSearch || haystack.includes(normalizedSearch);
        const foodTypeMatch = !selectedFoodType || (item.foodType || "non_veg") === selectedFoodType;
        return categoryMatch && subCategoryMatch && searchMatch && foodTypeMatch;
      })
      .sort(sorter);
  }, [items, selectedCategory, selectedSubCategory, normalizedSearch, selectedFoodType, sortBy]);

  const groupedByCategory = useMemo(() => {
    const map = {};
    for (const category of sortedCategories) {
      map[category._id] = {
        category,
        subCategoryMap: {},
        ungrouped: [],
      };
    }

    for (const subCategory of sortedSubCategories) {
      const parent = map[subCategory.category?._id || subCategory.category];
      if (!parent) continue;
      parent.subCategoryMap[subCategory._id] = {
        subCategory,
        items: [],
      };
    }

    for (const item of filteredItems) {
      const categoryId = item?.category?._id || item?.category;
      const subCategoryId = item?.subCategory?._id || item?.subCategory;
      const parent = map[categoryId];
      if (!parent) continue;
      if (subCategoryId && parent.subCategoryMap[subCategoryId]) {
        parent.subCategoryMap[subCategoryId].items.push(item);
      } else {
        parent.ungrouped.push(item);
      }
    }

    return map;
  }, [sortedCategories, sortedSubCategories, filteredItems]);
  const getSafeImageSrc = (url) => {
    const normalized = String(url || "").trim();
    return normalized || FALLBACK_IMAGE;
  };

  const getCartQuantity = (itemId) =>
    Number(cartItems.find((cartItem) => cartItem.menuItem === itemId)?.quantity || 0);

  const renderTrayButton = (item) => {
    const quantity = getCartQuantity(item._id);

    if (!showTrayActions) return null;

    if (quantity > 0) {
      return (
        <div className="mt-auto flex items-center gap-2">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDecrementItem?.(item);
            }}
            className="rounded-xl px-3 py-2 text-sm font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            -
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onIncrementItem?.(item);
            }}
            className="flex-1 rounded-xl py-2 text-sm font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            In Tray: {quantity} • Add More
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onRemoveItem?.(item._id);
            }}
            className="rounded-xl border px-3 py-2 text-sm font-bold"
            style={{ borderColor: palette.border, backgroundColor: palette.panelBg, color: palette.text }}
          >
            Remove
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onGoToTray?.();
            }}
            className="rounded-xl border px-3 py-2 text-sm font-bold"
            style={{ borderColor: palette.border, backgroundColor: `${primaryColor}14`, color: primaryColor }}
          >
            View Tray
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={(event) => {
          event.stopPropagation();
          onAddToCart?.(item);
        }}
        className="mt-auto w-full rounded-xl py-2 text-sm font-bold text-white"
        style={{ backgroundColor: primaryColor }}
      >
        Add To Order Tray
      </button>
    );
  };

  return (
    <section id="full-menu" className="mx-auto w-full max-w-[96rem] px-4 pb-16 md:px-8" style={{ color: palette.text }}>
      <div className="space-y-10">
        {sortedCategories.map((category) => {
          const group = groupedByCategory[category._id];
          if (!group) return null;

          const subGroups = Object.values(group.subCategoryMap);
          const totalItems = subGroups.reduce((sum, x) => sum + x.items.length, 0) + group.ungrouped.length;
          if (totalItems === 0) return null;

          return (
            <div key={category._id}>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black">{category.name}</h3>
                  <p className="text-sm" style={{ color: palette.muted }}>
                    {category.description || "Freshly curated selection."}
                  </p>
                </div>
                <span className="text-sm font-semibold" style={{ color: palette.muted }}>
                  {totalItems} items
                </span>
              </div>

              <div className="space-y-7">
                {subGroups
                  .filter((x) => x.items.length > 0)
                  .map(({ subCategory, items: subCategoryItems }) => (
                    <div key={subCategory._id}>
                      <div className="mb-3 rounded-[1.6rem] border px-4 py-3" style={{ background: `linear-gradient(135deg, ${softPrimary} 0%, ${palette.panelBg} 100%)`, borderColor: palette.border }}>
                        <p className="text-xs uppercase tracking-[0.18em]" style={{ color: palette.muted }}>
                          {subCategory.heading || category.name}
                        </p>
                        <h4 className="text-xl font-black">{subCategory.name}</h4>
                        <p className="text-sm" style={{ color: palette.muted }}>
                          {subCategory.subHeading || subCategory.description || "Chef curated section"}
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {subCategoryItems.map((item) => (
                          <article
                            key={item._id}
                            onClick={() => {
                              onItemTap?.(item);
                            }}
                            className={`group flex h-full flex-col overflow-hidden rounded-3xl shadow-[0_16px_32px_rgba(15,23,42,0.07)] transition-transform duration-300 hover:-translate-y-1 ${
                              onItemTap ? "cursor-pointer" : ""
                            }`}
                            style={{ border: `1px solid ${palette.border}`, backgroundColor: palette.cardBg }}
                          >
                            <div className="relative">
                              <img
                                src={getSafeImageSrc(item.image)}
                                alt={item.name}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = FALLBACK_IMAGE;
                                }}
                                className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              {item.discountLabel ? (
                                <span
                                  className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  {item.discountLabel}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex flex-1 flex-col p-4">
                              {item.heading || item.subHeading ? (
                                <div className="mb-2 min-h-[34px]">
                                  {item.heading ? (
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: palette.muted }}>
                                      {item.heading}
                                    </p>
                                  ) : null}
                                  {item.subHeading ? (
                                    <p className="text-xs font-medium" style={{ color: palette.muted }}>
                                      {item.subHeading}
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                              <div className="flex min-h-[56px] items-start justify-between gap-3">
                                <div>
                                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}>
                                    <span
                                      className="inline-block h-2.5 w-2.5 rounded-full"
                                      style={{ backgroundColor: (item.foodType || "non_veg") === "veg" ? "#16a34a" : "#dc2626" }}
                                    />
                                    {(item.foodType || "non_veg") === "veg" ? "Veg" : "Non-Veg"}
                                  </div>
                                  <h4 className="line-clamp-2 text-lg font-bold">{item.name}</h4>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-black">Rs {Number(item.price || 0).toFixed(2)}</p>
                                  {Number(item.compareAtPrice || 0) > Number(item.price || 0) ? (
                                    <p className="text-xs line-through" style={{ color: palette.muted }}>
                                      Rs {Number(item.compareAtPrice || 0).toFixed(2)}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                              <p className="mt-2 min-h-[40px] text-sm" style={{ color: palette.muted }}>
                                {item.shortDescription || item.description}
                              </p>
                              {item.shortDescription && item.description ? (
                                <p className="mt-1 min-h-[32px] text-xs" style={{ color: palette.muted }}>
                                  {item.description}
                                </p>
                              ) : null}
                              <div className="mt-3 min-h-[58px] content-start flex flex-wrap gap-2 text-[11px]">
                                <span className="rounded-full border px-2 py-1 font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}>
                                  Prep: {Number(item.prepTimeMinutes || 0)} min
                                </span>
                                <span className="rounded-full border px-2 py-1 font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}>
                                  Spice: {String(item.spiceLevel || "none").replace("_", " ")}
                                </span>
                                <span className="rounded-full border px-2 py-1 font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}>
                                  {String(item.stockStatus || "in_stock").replace("_", " ")}
                                </span>
                                {item.isFeatured ? (
                                  <span className="rounded-full border px-2 py-1 font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}>
                                    Featured
                                  </span>
                                ) : null}
                              </div>
                              {item.portions?.length ? (
                                <div className="mt-3 min-h-[44px] rounded-xl p-2 text-xs" style={{ backgroundColor: palette.panelBg, color: palette.muted }}>
                                  {item.portions.map((portion) => (
                                    <p key={`${item._id}-${portion.label}`}>
                                      {portion.label}
                                      {portion.quantityText ? ` (${portion.quantityText})` : ""}: Rs {Number(portion.price || 0).toFixed(2)}
                                    </p>
                                  ))}
                                </div>
                              ) : null}
                              {isCustomerView ? renderTrayButton(item) : null}
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}

                {group.ungrouped.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {group.ungrouped.map((item) => (
                      <article
                        key={item._id}
                        onClick={() => {
                          onItemTap?.(item);
                        }}
                        className={`flex h-full flex-col overflow-hidden rounded-3xl p-4 shadow-[0_16px_32px_rgba(15,23,42,0.07)] ${
                          onItemTap ? "cursor-pointer" : ""
                        }`}
                        style={{ border: `1px solid ${palette.border}`, backgroundColor: palette.cardBg }}
                      >
                        <div className="relative -mx-4 -mt-4 mb-3 overflow-hidden rounded-t-3xl">
                          <img
                            src={getSafeImageSrc(item.image)}
                            alt={item.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_IMAGE;
                            }}
                            className="h-48 w-full object-cover transition-transform duration-500"
                          />
                          {item.discountLabel ? (
                            <span
                              className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {item.discountLabel}
                            </span>
                          ) : null}
                        </div>
                        {item.heading || item.subHeading ? (
                          <div className="mb-2 min-h-[34px]">
                            {item.heading ? (
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: palette.muted }}>
                                {item.heading}
                              </p>
                            ) : null}
                            {item.subHeading ? (
                              <p className="text-xs font-medium" style={{ color: palette.muted }}>
                                {item.subHeading}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}>
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: (item.foodType || "non_veg") === "veg" ? "#16a34a" : "#dc2626" }}
                          />
                          {(item.foodType || "non_veg") === "veg" ? "Veg" : "Non-Veg"}
                        </div>
                        <h4 className="min-h-[56px] line-clamp-2 text-lg font-bold">{item.name}</h4>
                        <p className="mt-1 min-h-[40px] text-sm" style={{ color: palette.muted }}>{item.shortDescription || item.description}</p>
                        {item.shortDescription && item.description ? (
                          <p className="mt-1 min-h-[32px] text-xs" style={{ color: palette.muted }}>
                            {item.description}
                          </p>
                        ) : null}
                        <div className="mt-3 flex items-end justify-between gap-3">
                          <p className="text-lg font-black">Rs {Number(item.price || 0).toFixed(2)}</p>
                          {Number(item.compareAtPrice || 0) > Number(item.price || 0) ? (
                            <p className="text-xs line-through" style={{ color: palette.muted }}>
                              Rs {Number(item.compareAtPrice || 0).toFixed(2)}
                            </p>
                          ) : null}
                        </div>
                        <div className="mt-3 min-h-[58px] content-start flex flex-wrap gap-2 text-[11px]">
                          <span className="rounded-full border px-2 py-1 font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}>
                            Prep: {Number(item.prepTimeMinutes || 0)} min
                          </span>
                          <span className="rounded-full border px-2 py-1 font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}>
                            Spice: {String(item.spiceLevel || "none").replace("_", " ")}
                          </span>
                          <span className="rounded-full border px-2 py-1 font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}>
                            {String(item.stockStatus || "in_stock").replace("_", " ")}
                          </span>
                          {item.isFeatured ? (
                            <span className="rounded-full border px-2 py-1 font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}>
                              Featured
                            </span>
                          ) : null}
                        </div>
                        {item.portions?.length ? (
                          <div className="mt-3 min-h-[44px] rounded-xl p-2 text-xs" style={{ backgroundColor: palette.panelBg, color: palette.muted }}>
                            {item.portions.map((portion) => (
                              <p key={`${item._id}-${portion.label}`}>
                                {portion.label}
                                {portion.quantityText ? ` (${portion.quantityText})` : ""}: Rs {Number(portion.price || 0).toFixed(2)}
                              </p>
                            ))}
                          </div>
                        ) : null}
                        {isCustomerView ? renderTrayButton(item) : null}
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PublicMenuSections;
