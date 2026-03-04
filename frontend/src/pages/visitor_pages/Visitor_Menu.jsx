import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiFileText, FiMoon, FiSearch, FiSun, FiTag } from "react-icons/fi";
import menuService from "../../services/menu_Service";
import themeService from "../../services/theme_Service";
import PublicMenuSections from "../../components/menu/PublicMenuSections";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";
import { useAuth } from "../../context/AuthContext";

const Visitor_Menu = ({ isCustomerView = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
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
        className="mx-auto w-full max-w-[96rem] rounded-b-[2rem] px-4 py-8 text-white md:px-8"
        style={{ background: `linear-gradient(120deg, ${theme.primaryColor} 0%, #0f172a 100%)` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70 font-bold">{theme.name}</p>
            <h1 className="heading-1 text-white">{theme.menuHeading}</h1>
            <p className="text-lg text-white/80">{theme.menuSubHeading}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={homePath} className="inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-white hover:bg-white/10">
              <FiArrowLeft className="h-4 w-4" />
              Back Home
            </Link>
            {allowUserThemeToggle ? (
              <button onClick={() => setUserMode(resolvedMode === "dark" ? "light" : "dark")} className="inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-white hover:bg-white/10">
                {resolvedMode === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
                {resolvedMode === "dark" ? "Light" : "Dark"}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 w-full max-w-[96rem] px-4 md:px-8">
        <div className="card-elevated space-y-4 p-6" style={{ backgroundColor: palette.panelBg }}>
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
          <div className="card-elevated p-6" style={{ backgroundColor: palette.cardBg }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] font-bold text-slate-600">
                  <FiFileText className="h-4 w-4" />
                  Menu PDF
                </p>
                <p className="heading-5" style={{ color: palette.text }}>{menuData.menuPdf.name}</p>
                <p className="text-sm text-slate-600 mt-1">High-resolution menu reference available for download</p>
              </div>
              <a
                href={menuData.menuPdf.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold text-white"
                style={{ background: theme.primaryColor }}
              >
                <FiFileText className="h-4 w-4" />
                Open PDF
              </a>
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
