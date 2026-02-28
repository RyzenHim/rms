import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import menuService from "../../services/menu_Service";
import themeService from "../../services/theme_Service";
import { useAuth } from "../../context/AuthContext";

const cardStyles = "rounded-3xl border border-white/20 bg-white p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)]";

const Visitor_Home = ({ isCustomerView = false }) => {
  const { isAuthenticated } = useAuth();
  const [theme, setTheme] = useState(null);
  const [menuData, setMenuData] = useState({ categories: [], items: [] });

  useEffect(() => {
    const loadPageData = async () => {
      const [themeRes, menuRes] = await Promise.all([
        themeService.getActiveTheme(),
        menuService.getPublicMenu(),
      ]);
      setTheme(themeRes.theme);
      setMenuData({
        categories: menuRes.categories,
        items: menuRes.items,
      });
    };

    loadPageData().catch((err) => {
      console.error("Landing load failed:", err);
    });
  }, []);

  const featured = useMemo(
    () => menuData.items.filter((item) => item.isFeatured).slice(0, 6),
    [menuData.items],
  );

  const activeTheme = theme || {
    logoText: "DelishDrop",
    heroTitle: "Delicious food at your doorstep",
    heroSubtitle: "Freshly crafted meals with lightning fast delivery.",
    ctaText: "Get Started",
    primaryColor: "#0b6b49",
    secondaryColor: "#ffd54f",
    accentColor: "#1f2937",
    surfaceColor: "#f8faf8",
    heroImage:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80",
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: activeTheme.surfaceColor,
      }}
    >
      <section
        className="mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-8"
        style={{
          color: "#fff",
        }}
      >
        <div
          className="overflow-hidden rounded-3xl p-6 md:p-10"
          style={{
            background: `linear-gradient(140deg, ${activeTheme.primaryColor} 0%, #064e3b 80%)`,
          }}
        >
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="text-2xl font-black">
              {activeTheme.logoText}
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <Link to="/" className="rounded-full px-4 py-2 hover:bg-white/10">
                Home
              </Link>
              <a href="#menu" className="rounded-full px-4 py-2 hover:bg-white/10">
                Menu & Flavors
              </a>
              {!isAuthenticated ? (
                <>
                  <Link to="/auth/login" className="rounded-full border border-white/30 px-4 py-2">
                    Login
                  </Link>
                  <Link
                    to="/auth/signup"
                    className="rounded-full px-4 py-2 font-semibold"
                    style={{ background: activeTheme.secondaryColor, color: "#111827" }}
                  >
                    Sign Up
                  </Link>
                </>
              ) : null}
            </div>
          </nav>

          <div className="mt-10 grid items-center gap-8 md:grid-cols-2">
            <div>
              <p className="mb-4 inline-block rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-widest">
                Premium Restaurant Experience
              </p>
              <h1 className="text-4xl font-black leading-tight md:text-6xl">{activeTheme.heroTitle}</h1>
              <p className="mt-4 max-w-xl text-emerald-100">{activeTheme.heroSubtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  className="rounded-full px-6 py-3 text-sm font-bold"
                  style={{ backgroundColor: activeTheme.secondaryColor, color: "#111827" }}
                >
                  {isCustomerView ? "Start Ordering" : activeTheme.ctaText}
                </button>
                {!isAuthenticated ? (
                  <Link
                    to="/auth/login"
                    className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold"
                  >
                    Join Now
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="relative">
              <img
                src={activeTheme.heroImage}
                alt="featured meal"
                className="h-80 w-full rounded-[2rem] object-cover md:h-[28rem]"
              />
              <div className="absolute -bottom-5 -left-4 rounded-2xl bg-white p-4 text-slate-900 shadow-2xl">
                <p className="text-xs uppercase tracking-widest text-slate-500">Happy Customers</p>
                <p className="text-2xl font-black">1,500+</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto grid max-w-7xl gap-6 px-4 pb-8 md:grid-cols-3 md:px-8">
        {featured.slice(0, 3).map((item) => (
          <article key={item._id} className={cardStyles}>
            <img src={item.image} alt={item.name} className="h-44 w-full rounded-2xl object-cover" />
            <h3 className="mt-3 text-lg font-bold text-slate-900">{item.name}</h3>
            <p className="text-sm text-slate-500">{item.shortDescription || item.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xl font-black text-slate-900">${item.price?.toFixed(2)}</p>
              <button
                className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: activeTheme.primaryColor }}
              >
                {isCustomerView ? "Add to Cart" : "View"}
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 md:px-8">
        <div
          className="rounded-3xl p-7"
          style={{
            background: "linear-gradient(120deg, #d9f99d 0%, #bbf7d0 55%, #ecfccb 100%)",
          }}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-black text-slate-900">Explore Cuisine by Category</h2>
            <p className="text-sm text-slate-700">Freshly curated options for every mood.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {menuData.categories.map((category) => (
              <article key={category._id} className="rounded-2xl bg-white p-4 shadow-lg">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-32 w-full rounded-xl object-cover"
                />
                <h3 className="mt-3 text-lg font-bold text-slate-900">{category.name}</h3>
                <p className="text-sm text-slate-600">{category.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
        <h2 className="mb-5 text-4xl font-black text-slate-900">Flash Deals</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {menuData.items.slice(0, 6).map((item) => (
            <article key={item._id} className={`${cardStyles} flex items-center gap-4`}>
              <img src={item.image} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{item.name}</h3>
                <p className="text-sm text-slate-600">{item.prepTimeMinutes} min</p>
                <p className="mt-1 font-black text-slate-900">${item.price?.toFixed(2)}</p>
              </div>
              <button
                className="rounded-full px-3 py-2 text-xs font-bold text-white"
                style={{ backgroundColor: activeTheme.accentColor }}
              >
                {isCustomerView ? "Add" : "Check"}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Visitor_Home;
