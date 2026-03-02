import { useMemo } from "react";

const sorters = {
  featured: (a, b) => Number(b.isFeatured) - Number(a.isFeatured),
  "price-asc": (a, b) => Number(a.price || 0) - Number(b.price || 0),
  "price-desc": (a, b) => Number(b.price || 0) - Number(a.price || 0),
  newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
};

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
  onItemTap,
}) => {
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

  return (
    <section id="full-menu" className="mx-auto max-w-7xl px-4 pb-16 md:px-8" style={{ color: palette.text }}>
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
                      <div className="mb-3 rounded-2xl px-4 py-3" style={{ backgroundColor: palette.cardBg }}>
                        <p className="text-xs uppercase tracking-[0.18em]" style={{ color: palette.muted }}>
                          {subCategory.heading || category.name}
                        </p>
                        <h4 className="text-xl font-black">{subCategory.name}</h4>
                        <p className="text-sm" style={{ color: palette.muted }}>
                          {subCategory.subHeading || subCategory.description || "Chef curated section"}
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {subCategoryItems.map((item) => (
                          <article
                            key={item._id}
                            onClick={() => {
                              if (!isCustomerView) onItemTap?.(item);
                            }}
                            className={`group overflow-hidden rounded-3xl shadow-[0_16px_32px_rgba(15,23,42,0.07)] transition-transform duration-300 hover:-translate-y-1 ${
                              !isCustomerView ? "cursor-pointer" : ""
                            }`}
                            style={{ border: `1px solid ${palette.border}`, backgroundColor: palette.cardBg }}
                          >
                            <div className="relative">
                              <img
                                src={item.image}
                                alt={item.name}
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
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <h4 className="text-lg font-bold">{item.name}</h4>
                                <p className="text-lg font-black">
                                  ${Number(item.price || 0).toFixed(2)}
                                </p>
                              </div>
                              <p className="mt-2 text-sm" style={{ color: palette.muted }}>
                                {item.shortDescription || item.description}
                              </p>
                              <div className="mt-2 inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-semibold" style={{ borderColor: palette.border }}>
                                <span
                                  className="inline-block h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: (item.foodType || "non_veg") === "veg" ? "#16a34a" : "#dc2626" }}
                                />
                                {(item.foodType || "non_veg") === "veg" ? "Veg" : "Non-Veg"}
                              </div>
                              {item.portions?.length ? (
                                <div className="mt-3 rounded-xl p-2 text-xs" style={{ backgroundColor: palette.panelBg, color: palette.muted }}>
                                  {item.portions.map((portion) => (
                                    <p key={`${item._id}-${portion.label}`}>
                                      {portion.label}: ${Number(portion.price || 0).toFixed(2)}
                                    </p>
                                  ))}
                                </div>
                              ) : null}
                              {isCustomerView ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToCart?.(item);
                                  }}
                                  className="mt-4 w-full rounded-xl py-2 text-sm font-bold text-white"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  Add To Order Tray
                                </button>
                              ) : null}
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}

                {group.ungrouped.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.ungrouped.map((item) => (
                      <article
                        key={item._id}
                        onClick={() => {
                          if (!isCustomerView) onItemTap?.(item);
                        }}
                        className={`overflow-hidden rounded-3xl p-4 shadow-[0_16px_32px_rgba(15,23,42,0.07)] ${
                          !isCustomerView ? "cursor-pointer" : ""
                        }`}
                        style={{ border: `1px solid ${palette.border}`, backgroundColor: palette.cardBg }}
                      >
                        <h4 className="text-lg font-bold">{item.name}</h4>
                        <p className="mt-1 text-sm" style={{ color: palette.muted }}>{item.shortDescription || item.description}</p>
                        <p className="mt-3 text-lg font-black">${Number(item.price || 0).toFixed(2)}</p>
                        {isCustomerView ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart?.(item);
                            }}
                            className="mt-4 w-full rounded-xl py-2 text-sm font-bold text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Add To Order Tray
                          </button>
                        ) : null}
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
