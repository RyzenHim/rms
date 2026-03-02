import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import menuService from "../../services/menu_Service";
import themeService from "../../services/theme_Service";
import PublicMenuSections from "../../components/menu/PublicMenuSections";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";
import { useAuth } from "../../context/AuthContext";

const Visitor_Menu = ({ isCustomerView = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [theme, setTheme] = useState({
    name: "Emerald Bistro",
    menuHeading: "Dynamic Menu",
    menuSubHeading: "All sections are controlled from Admin panel.",
    primaryColor: "#0b6b49",
    secondaryColor: "#ffd54f",
    colorMode: "system",
    allowUserThemeToggle: true,
  });
  const [menuData, setMenuData] = useState({ categories: [], subCategories: [], items: [], menuPdf: null });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [foodTypeFilter, setFoodTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const { palette, resolvedMode, setUserMode, allowUserThemeToggle } = useResolvedColorMode(theme);

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

  const homePath = isCustomerView ? "/customer" : "/";
  const onPublicItemTap = () => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    if (user?.roles?.includes("customer")) {
      navigate("/customer/menu");
      return;
    }
    navigate("/dashboard");
  };
  const subCategoryOptions = useMemo(() => {
    if (!categoryFilter) return menuData.subCategories;
    return menuData.subCategories.filter((sub) => (sub.category?._id || sub.category) === categoryFilter);
  }, [menuData.subCategories, categoryFilter]);

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: palette.pageBg, color: palette.text }}>
      <section
        className="mx-auto max-w-7xl rounded-b-[2rem] px-4 py-6 text-white md:px-8"
        style={{ background: `linear-gradient(120deg, ${theme.primaryColor} 0%, #0f172a 100%)` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">{theme.name}</p>
            <h1 className="text-3xl font-black">{theme.menuHeading}</h1>
            <p className="mt-1 text-sm text-white/80">{theme.menuSubHeading}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={homePath} className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold">Back Home</Link>
            {allowUserThemeToggle ? (
              <button onClick={() => setUserMode(resolvedMode === "dark" ? "light" : "dark")} className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold">
                {resolvedMode === "dark" ? "Light" : "Dark"}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4 md:px-8">
        <div className="rounded-2xl p-4 shadow-sm" style={{ border: `1px solid ${palette.border}`, backgroundColor: palette.panelBg }}>
          <div className="grid gap-3 md:grid-cols-5">
            <input type="text" placeholder="Search menu, heading, category..." value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }} />
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setSubCategoryFilter(""); }} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}>
              <option value="">All Categories</option>{menuData.categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
            <select value={subCategoryFilter} onChange={(e) => setSubCategoryFilter(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}>
              <option value="">All Sub-Categories</option>{subCategoryOptions.map((subCategory) => <option key={subCategory._id} value={subCategory._id}>{subCategory.name}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}>
              <option value="featured">Featured First</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="newest">Newest First</option>
            </select>
            <div className="flex rounded-xl border p-1" style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}>
              <button onClick={() => setFoodTypeFilter("")} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${foodTypeFilter === "" ? "text-white" : ""}`} style={{ backgroundColor: foodTypeFilter === "" ? theme.primaryColor : "transparent", color: foodTypeFilter === "" ? "#fff" : palette.text }}>All</button>
              <button onClick={() => setFoodTypeFilter("veg")} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${foodTypeFilter === "veg" ? "text-white" : ""}`} style={{ backgroundColor: foodTypeFilter === "veg" ? "#16a34a" : "transparent", color: foodTypeFilter === "veg" ? "#fff" : palette.text }}>Veg</button>
              <button onClick={() => setFoodTypeFilter("non_veg")} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${foodTypeFilter === "non_veg" ? "text-white" : ""}`} style={{ backgroundColor: foodTypeFilter === "non_veg" ? "#dc2626" : "transparent", color: foodTypeFilter === "non_veg" ? "#fff" : palette.text }}>Non-Veg</button>
            </div>
          </div>
          {menuData.menuPdf ? (
            <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}>
              <p className="mb-2 text-sm font-semibold" style={{ color: palette.muted }}>Menu PDF Reference</p>
              <p className="text-sm" style={{ color: palette.text }}>{menuData.menuPdf.name}</p>
              <a
                href={menuData.menuPdf.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Open PDF Menu
              </a>
            </div>
          ) : null}
        </div>
      </section>

      <div className="pt-8">
        <PublicMenuSections
          categories={menuData.categories}
          subCategories={menuData.subCategories}
          items={menuData.items}
          primaryColor={theme.primaryColor}
          isCustomerView={isCustomerView}
          search={search}
          selectedCategory={categoryFilter}
          selectedSubCategory={subCategoryFilter}
          selectedFoodType={foodTypeFilter}
          sortBy={sortBy}
          palette={palette}
          onItemTap={onPublicItemTap}
        />
      </div>
    </div>
  );
};

export default Visitor_Menu;
