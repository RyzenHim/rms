import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiFileText, FiSearch, FiSliders } from "react-icons/fi";
import menuService from "../../services/menu_Service";
import themeService from "../../services/theme_Service";
import PublicMenuSections from "../../components/menu/PublicMenuSections";
import MenuItemQuickViewModal from "../../components/menu/MenuItemQuickViewModal";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";
import useOrderTray from "../../hooks/useOrderTray";
import { useAuth } from "../../context/AuthContext";

const Visitor_Menu = ({ isCustomerView = false }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { setCart } = useOrderTray();
  const [theme, setTheme] = useState({
    name: "Feane Restaurant",
    menuHeading: "Dynamic Menu",
    menuSubHeading: "All sections are controlled from Admin panel.",
    primaryColor: "#ff8c3a",
    secondaryColor: "#ffd700",
    colorMode: "system",
    allowUserThemeToggle: true,
  });
  const [menuData, setMenuData] = useState({ categories: [], subCategories: [], items: [], menuPdf: null });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [foodTypeFilter, setFoodTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedItem, setSelectedItem] = useState(null);
  const { palette } = useResolvedColorMode(theme);

  useEffect(() => {
    const loadData = async () => {
      const [themeRes, menuRes] = await Promise.all([themeService.getActiveTheme(), menuService.getPublicMenu()]);
      setTheme((prev) => ({ ...prev, ...themeRes.theme }));
      setMenuData({
        categories: menuRes.categories || [],
        subCategories: menuRes.subCategories || [],
        items: menuRes.items || [],
        menuPdf: menuRes.menuPdf || null,
      });
    };
    loadData().catch((err) => console.error("Menu page load failed:", err));
  }, []);

  useEffect(() => {
    const categorySlug = searchParams.get("category");
    const subCategorySlug = searchParams.get("subCategory");
    const itemSlug = searchParams.get("item");

    if (categorySlug && menuData.categories.length) {
      const matchedCategory = menuData.categories.find((category) => category.slug === categorySlug);
      if (matchedCategory) setCategoryFilter(matchedCategory._id);
    }

    if (subCategorySlug && menuData.subCategories.length) {
      const matchedSubCategory = menuData.subCategories.find((subCategory) => subCategory.slug === subCategorySlug);
      if (matchedSubCategory) setSubCategoryFilter(matchedSubCategory._id);
    }

    if (itemSlug && menuData.items.length) {
      const matchedItem = menuData.items.find((item) => item.slug === itemSlug);
      if (matchedItem) setSelectedItem(matchedItem);
    }
  }, [searchParams, menuData.categories, menuData.subCategories, menuData.items]);

  const onPublicItemTap = (item) => {
    setSelectedItem(item);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("item", item.slug);
    setSearchParams(nextParams, { replace: true });
  };

  const subCategoryOptions = useMemo(() => {
    if (!categoryFilter) return menuData.subCategories;
    return menuData.subCategories.filter((sub) => (sub.category?._id || sub.category) === categoryFilter);
  }, [menuData.subCategories, categoryFilter]);

  const canAddToTray = isAuthenticated && user?.roles?.includes("customer");

  const addToTray = (item) => {
    if (!canAddToTray) {
      onPublicItemTap();
      return;
    }

    setCart((prev) => {
      const found = prev.find((entry) => entry.menuItem === item._id);
      if (found) {
        return prev.map((entry) => (
          entry.menuItem === item._id ? { ...entry, quantity: entry.quantity + 1 } : entry
        ));
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

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: palette.pageBg, color: palette.text }}>
      <section className="mx-auto mt-6 w-full max-w-[96rem] px-4 md:px-8">
        <div className="card-elevated space-y-5 p-6" style={{ backgroundColor: palette.panelBg, boxShadow: palette.glassShadow }}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: palette.muted }}>Refined Discovery</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight" style={{ color: palette.text }}>
                Browse the full menu with precision
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: palette.muted }}>
                Filter by category, food type, and pricing to move from discovery to checkout faster.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]" style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}>
              <FiSliders className="h-3.5 w-3.5" />
              Smart Filters
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search menu items"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base pl-10"
                style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setSubCategoryFilter("");
              }}
              className="input-base"
              style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
            >
              <option value="">All Categories</option>
              {menuData.categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
            <select
              value={subCategoryFilter}
              onChange={(e) => setSubCategoryFilter(e.target.value)}
              className="input-base"
              style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
            >
              <option value="">All Subcategories</option>
              {subCategoryOptions.map((subCategory) => <option key={subCategory._id} value={subCategory._id}>{subCategory.name}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-base"
              style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
            <div className="flex rounded-xl border gap-1 p-1" style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}>
              <button onClick={() => setFoodTypeFilter("")} className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition-all ${foodTypeFilter === "" ? "text-white shadow-md" : ""}`} style={{ backgroundColor: foodTypeFilter === "" ? theme.primaryColor : "transparent", color: foodTypeFilter === "" ? "#fff" : palette.text }}>All</button>
              <button onClick={() => setFoodTypeFilter("veg")} className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition-all ${foodTypeFilter === "veg" ? "text-white shadow-md" : ""}`} style={{ backgroundColor: foodTypeFilter === "veg" ? "#16a34a" : "transparent", color: foodTypeFilter === "veg" ? "#fff" : palette.text }}>Veg</button>
              <button onClick={() => setFoodTypeFilter("non_veg")} className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition-all ${foodTypeFilter === "non_veg" ? "text-white shadow-md" : ""}`} style={{ backgroundColor: foodTypeFilter === "non_veg" ? "#dc2626" : "transparent", color: foodTypeFilter === "non_veg" ? "#fff" : palette.text }}>Non-Veg</button>
            </div>
          </div>
        </div>
      </section>

      {menuData.menuPdf ? (
        <div className="mx-auto w-full max-w-[96rem] px-4 md:px-8 py-6">
          <div className="card-elevated p-6" style={{ backgroundColor: palette.cardBg, boxShadow: palette.glassShadow }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] font-bold" style={{ color: palette.muted }}>
                  <FiFileText className="h-4 w-4" />
                  Menu PDF
                </p>
                <p className="heading-5" style={{ color: palette.text }}>{menuData.menuPdf.name}</p>
                <p className="mt-1 text-sm" style={{ color: palette.muted }}>Menu PDF preview loaded inside this page.</p>
              </div>
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold text-white"
                style={{ background: theme.primaryColor }}
              >
                <FiFileText className="h-4 w-4" />
                PDF Viewer
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border" style={{ borderColor: palette.border }}>
              <iframe
                src={`${menuData.menuPdf.url}#toolbar=1&navpanes=0&view=fitH`}
                title="Restaurant menu PDF"
                className="h-[70vh] w-full bg-white"
              />
            </div>
          </div>
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
          onItemTap={onPublicItemTap}
        />
      </div>

      <MenuItemQuickViewModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => {
          setSelectedItem(null);
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete("item");
          setSearchParams(nextParams, { replace: true });
        }}
        palette={palette}
        theme={theme}
        onAddToCart={addToTray}
      />
    </div>
  );
};

export default Visitor_Menu;
