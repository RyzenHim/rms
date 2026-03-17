import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { FiFileText, FiSearch, FiSliders, FiX } from "react-icons/fi";
import PublicMenuSections from "../../components/menu/PublicMenuSections";
import MenuItemQuickViewModal from "../../components/menu/MenuItemQuickViewModal";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";
import useOrderTray from "../../hooks/useOrderTray";
import { useAuth } from "../../context/AuthContext";

const GlassPanel = ({ children, palette, className = "" }) => (
  <div
    className={`rounded-[1.5rem] border ${className}`}
    style={{
      backgroundColor: palette.panelBg,
      borderColor: palette.border,
      backdropFilter: palette.backdrop,
      WebkitBackdropFilter: palette.backdrop,
      boxShadow: palette.glassShadow,
    }}
  >
    {children}
  </div>
);

const FilterSelect = ({ value, onChange, palette, children }) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full rounded-[0.85rem] border px-3 py-2.5 text-sm font-medium outline-none transition-shadow focus:ring-2"
    style={{
      borderColor: palette.border,
      backgroundColor: palette.cardBg,
      color: palette.text,
    }}
  >
    {children}
  </select>
);

const Visitor_Menu = ({ isCustomerView = false }) => {
  const navigate = useNavigate();
  const { theme: sharedTheme = {}, menuData = { categories: [], subCategories: [], items: [], menuPdf: null } } = useOutletContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { cart, setCart } = useOrderTray();
  const theme = {
    name: "Feane Restaurant",
    menuHeading: "Dynamic Menu",
    menuSubHeading: "All sections are controlled from Admin panel.",
    primaryColor: "#ff8c3a",
    secondaryColor: "#ffd700",
    colorMode: "system",
    allowUserThemeToggle: true,
    ...sharedTheme,
  };
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [foodTypeFilter, setFoodTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedItem, setSelectedItem] = useState(null);
  const { palette } = useResolvedColorMode(theme);

  useEffect(() => {
    const categorySlug = searchParams.get("category");
    const subCategorySlug = searchParams.get("subCategory");
    const itemSlug = searchParams.get("item");

    if (categorySlug && menuData.categories.length) {
      const match = menuData.categories.find((category) => category.slug === categorySlug);
      if (match) setCategoryFilter(match._id);
    }
    if (subCategorySlug && menuData.subCategories.length) {
      const match = menuData.subCategories.find((subCategory) => subCategory.slug === subCategorySlug);
      if (match) setSubCategoryFilter(match._id);
    }
    if (itemSlug && menuData.items.length) {
      const match = menuData.items.find((item) => item.slug === itemSlug);
      if (match) setSelectedItem(match);
    }
  }, [searchParams, menuData.categories, menuData.subCategories, menuData.items]);

  const onPublicItemTap = (item) => {
    setSelectedItem(item);
    const next = new URLSearchParams(searchParams);
    next.set("item", item.slug);
    setSearchParams(next, { replace: true });
  };

  const subCategoryOptions = useMemo(() => {
    if (!categoryFilter) return menuData.subCategories;
    return menuData.subCategories.filter((subCategory) => (subCategory.category?._id || subCategory.category) === categoryFilter);
  }, [menuData.subCategories, categoryFilter]);

  const canAddToTray = isAuthenticated && user?.roles?.includes("customer");

  const addToTray = (item) => {
    if (!canAddToTray) {
      navigate("/auth/login");
      return;
    }
    setCart((prev) => {
      const found = prev.find((entry) => entry.menuItem === item._id);
      if (found) {
        return prev.map((entry) => (entry.menuItem === item._id ? { ...entry, quantity: entry.quantity + 1 } : entry));
      }
      return [
        ...prev,
        {
          menuItem: item._id,
          name: item.name,
          unitPrice: Number(item.price || 0),
          quantity: 1,
          notes: "",
          image: item.image,
        },
      ];
    });
  };

  const incrementTrayItem = (item) => addToTray(item);

  const decrementTrayItem = (item) => {
    if (!canAddToTray) {
      navigate("/auth/login");
      return;
    }
    setCart((prev) =>
      prev
        .map((entry) => (entry.menuItem === item._id ? { ...entry, quantity: entry.quantity - 1 } : entry))
        .filter((entry) => Number(entry.quantity || 0) > 0)
    );
  };

  const removeTrayItem = (menuItemId) => {
    if (!canAddToTray) {
      navigate("/auth/login");
      return;
    }
    setCart((prev) => prev.filter((entry) => entry.menuItem !== menuItemId));
  };

  const activeFilters = [categoryFilter, subCategoryFilter, foodTypeFilter, search].filter(Boolean).length;

  const clearAllFilters = () => {
    setCategoryFilter("");
    setSubCategoryFilter("");
    setFoodTypeFilter("");
    setSearch("");
    setSortBy("featured");
  };

  const foodTypes = [
    { value: "", label: "All" },
    { value: "veg", label: "Veg", activeColor: "#16a34a" },
    { value: "non_veg", label: "Non-Veg", activeColor: "#dc2626" },
  ];

  return (
    <div className="min-h-screen pb-14" style={{ backgroundColor: palette.pageBg, color: palette.text }}>
      <section className="mx-auto mt-6 w-full max-w-[96rem] px-4 md:px-8">
        <GlassPanel palette={palette} className="p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: palette.muted }}>Refined Discovery</p>
              <h1 className="mt-1.5 text-[clamp(1.5rem,2.8vw,2.1rem)] font-black tracking-tight" style={{ color: palette.text }}>
                Browse the full menu
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-6" style={{ color: palette.muted }}>
                Filter by category, food type, and pricing to move from discovery to checkout faster.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeFilters > 0 ? (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80"
                  style={{
                    borderColor: theme.primaryColor,
                    color: theme.primaryColor,
                    backgroundColor: `${theme.primaryColor}12`,
                  }}
                >
                  <FiX className="h-3.5 w-3.5" />
                  Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}
                </button>
              ) : null}
              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]"
                style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
              >
                <FiSliders className="h-3.5 w-3.5" />
                Smart Filters
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: palette.muted }} />
              <input
                type="text"
                placeholder="Search menu items..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-[0.85rem] border py-2.5 pl-10 pr-3 text-sm outline-none transition-shadow focus:ring-2"
                style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
              />
            </div>

            <FilterSelect
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setSubCategoryFilter("");
              }}
              palette={palette}
            >
              <option value="">All Categories</option>
              {menuData.categories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </FilterSelect>

            <FilterSelect value={subCategoryFilter} onChange={(event) => setSubCategoryFilter(event.target.value)} palette={palette}>
              <option value="">All Subcategories</option>
              {subCategoryOptions.map((subCategory) => (
                <option key={subCategory._id} value={subCategory._id}>{subCategory.name}</option>
              ))}
            </FilterSelect>

            <FilterSelect value={sortBy} onChange={(event) => setSortBy(event.target.value)} palette={palette}>
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </FilterSelect>

            <div className="flex items-center gap-1 rounded-[0.85rem] border p-1" style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}>
              {foodTypes.map(({ value, label, activeColor }) => {
                const isActive = foodTypeFilter === value;
                return (
                  <button
                    key={value}
                    onClick={() => setFoodTypeFilter(value)}
                    className="flex-1 rounded-[0.6rem] px-2 py-2 text-xs font-bold transition-all duration-200"
                    style={{
                      backgroundColor: isActive ? activeColor || theme.primaryColor : "transparent",
                      color: isActive ? "#fff" : palette.text,
                      boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </GlassPanel>
      </section>

      {menuData.menuPdf ? (
        <div className="mx-auto mt-6 w-full max-w-[96rem] px-4 md:px-8">
          <GlassPanel palette={palette} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: palette.muted }}>
                  <FiFileText className="h-4 w-4" />
                  Menu PDF
                </p>
                <p className="text-lg font-black" style={{ color: palette.text }}>{menuData.menuPdf.name}</p>
                <p className="mt-0.5 text-sm" style={{ color: palette.muted }}>Menu PDF preview loaded inside this page.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md" style={{ background: theme.primaryColor }}>
                <FiFileText className="h-4 w-4" />
                PDF Viewer
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.1rem] border" style={{ borderColor: palette.border }}>
              <iframe
                src={`${menuData.menuPdf.url}#toolbar=1&navpanes=0&view=fitH`}
                title="Restaurant menu PDF"
                className="h-[70vh] w-full bg-white"
              />
            </div>
          </GlassPanel>
        </div>
      ) : null}

      <div className="pt-8">
        <PublicMenuSections
          categories={menuData.categories}
          subCategories={menuData.subCategories}
          items={menuData.items}
          primaryColor={theme.primaryColor}
          isCustomerView={isCustomerView || canAddToTray}
          search={search}
          selectedCategory={categoryFilter}
          selectedSubCategory={subCategoryFilter}
          selectedFoodType={foodTypeFilter}
          sortBy={sortBy}
          palette={palette}
          onAddToCart={addToTray}
          onIncrementItem={incrementTrayItem}
          onDecrementItem={decrementTrayItem}
          onRemoveItem={removeTrayItem}
          onItemTap={onPublicItemTap}
          cartItems={cart}
          showTrayActions={isCustomerView || canAddToTray}
        />
      </div>

      <MenuItemQuickViewModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => {
          setSelectedItem(null);
          const next = new URLSearchParams(searchParams);
          next.delete("item");
          setSearchParams(next, { replace: true });
        }}
        palette={palette}
        theme={theme}
        onAddToCart={addToTray}
        onIncrementItem={incrementTrayItem}
        onDecrementItem={decrementTrayItem}
        onRemoveItem={removeTrayItem}
        cartItems={cart}
      />
    </div>
  );
};

export default Visitor_Menu;
