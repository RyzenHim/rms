import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiAward, FiClock, FiCoffee, FiGrid, FiHeart, FiStar, FiTruck } from "react-icons/fi";
import menuService from "../../services/menu_Service";
import themeService from "../../services/theme_Service";
import { useAuth } from "../../context/AuthContext";
import PublicMenuSections from "../../components/menu/PublicMenuSections";
import MenuItemQuickViewModal from "../../components/menu/MenuItemQuickViewModal";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";
import useOrderTray from "../../hooks/useOrderTray";

const fallbackTheme = {
  name: "Feane Restaurant",
  logoText: "Feane",
  logoImage: "",
  heroTitle: "Premium Food and Restaurant Experience",
  heroSubtitle: "Freshly crafted meals with lightning fast delivery.",
  heroTagline: "Premium Food and Restaurant Experience",
  ctaText: "Order Now",
  primaryColor: "#ff8c3a",
  secondaryColor: "#ffd700",
  accentColor: "#292524",
  surfaceColor: "#fafaf9",
  heroImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80",
  contactPhone: "+91 99999 99999",
  contactEmail: "hello@feane.com",
  addressLine: "123 Food Street, Downtown",
  city: "Mumbai",
  state: "Maharashtra",
  country: "India",
  postalCode: "400001",
  openingHours: "Mon-Sun: 11:00 AM - 11:00 PM",
  footerNote: "Fresh food. Fast service. Great moments.",
  colorMode: "system",
  allowUserThemeToggle: true,
};

const Visitor_Home = ({ isCustomerView = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { setCart } = useOrderTray();
  const [theme, setTheme] = useState(fallbackTheme);
  const [menuData, setMenuData] = useState({ categories: [], subCategories: [], items: [], menuPdf: null });
  const [slideIndex, setSlideIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const { palette } = useResolvedColorMode(theme);

  useEffect(() => {
    const loadPageData = async () => {
      const [themeRes, menuRes] = await Promise.all([themeService.getActiveTheme(), menuService.getPublicMenu()]);
      setTheme((prev) => ({ ...prev, ...themeRes.theme }));
      setMenuData({
        categories: menuRes.categories || [],
        subCategories: menuRes.subCategories || [],
        items: menuRes.items || [],
        menuPdf: menuRes.menuPdf || null,
      });
    };
    loadPageData().catch((err) => console.error("Landing load failed:", err));
  }, []);

  const featuredSlides = useMemo(() => {
    const featured = menuData.items.filter((item) => item.isFeatured).slice(0, 5);
    return featured.length ? featured : menuData.items.slice(0, 5);
  }, [menuData.items]);

  useEffect(() => {
    if (featuredSlides.length <= 1) return undefined;
    const timer = setInterval(() => setSlideIndex((prev) => (prev + 1) % featuredSlides.length), 3500);
    return () => clearInterval(timer);
  }, [featuredSlides.length]);

  const menuPath = isCustomerView || (isAuthenticated && user?.roles?.includes("customer")) ? "/customer/menu" : "/menu";
  const onPublicItemTap = (item) => {
    setSelectedItem(item);
  };

  const handleReserveClick = () => {
    if (!isAuthenticated) {
      navigate("/auth/login", { state: { from: "/customer/my-reservations" } });
      return;
    }
    if (user?.roles?.includes("customer")) {
      navigate("/customer/my-reservations");
      return;
    }
    navigate("/dashboard");
  };

  const currentSlide = featuredSlides[slideIndex];
  const featuredCategories = menuData.categories.slice(0, 6);
  const topRatedItems = [...menuData.items]
    .sort((a, b) => Number(b.averageRating || b.rating || 0) - Number(a.averageRating || a.rating || 0))
    .slice(0, 4);
  const quickStats = [
    { label: "Curated Dishes", value: menuData.items.length || 24, icon: FiGrid },
    { label: "Fast Prep", value: "18 min", icon: FiClock },
    { label: "Top Rated", value: "4.8/5", icon: FiStar },
    { label: "Daily Delivery", value: "Live", icon: FiTruck },
  ];
  const promiseCards = [
    { title: "Chef-Led Menu", copy: "Balanced flavors, premium plating, and seasonal specials.", icon: FiAward },
    { title: "Category Discovery", copy: "Browse mains, beverages, snacks and signature picks in one tap.", icon: FiCoffee },
    { title: "Loved By Regulars", copy: "Real customer ratings and comments inside every item quick view.", icon: FiHeart },
  ];

  const getCategoryIcon = (categoryName = "") => {
    const normalized = categoryName.toLowerCase();
    if (normalized.includes("drink") || normalized.includes("beverage")) return FiCoffee;
    if (normalized.includes("snack")) return FiStar;
    return FiGrid;
  };

  const openCategoryMenu = (category) => {
    navigate(`${menuPath}?category=${category.slug}`);
  };

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: palette.pageBg, color: palette.text }}>
      <section className="relative mx-auto w-full max-w-[112rem] px-3 pb-6 pt-4 md:px-5">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="hero-orb-left" style={{ background: `${theme.secondaryColor}80` }} />
          <div className="hero-orb-right" style={{ background: `${theme.primaryColor}80` }} />
          <div className="absolute left-[14%] top-[12%] h-28 w-28 rounded-full border border-white/20 bg-white/10 blur-sm" />
          <div className="absolute right-[18%] top-[22%] h-20 w-20 rounded-[1.5rem] border border-white/10 bg-white/10 rotate-12" />
        </div>
        <div
          className="overflow-hidden rounded-[1.8rem] border p-4 text-white md:p-6"
          style={{
            background: `radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 22%), linear-gradient(128deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%)`,
            borderColor: "rgba(255,255,255,0.15)",
            boxShadow: "0 35px 80px rgba(15, 23, 42, 0.22)",
          }}
        >
          <div className="mt-2 grid items-center gap-6 md:grid-cols-[1.05fr_0.95fr]">
            <div className="animate-rise-in space-y-4">
              <div className="inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] backdrop-blur">{theme.heroTagline}</div>
              <h1 className="heading-1 max-w-2xl text-white leading-[1.02]">{theme.heroTitle}</h1>
              <p className="max-w-xl text-sm leading-6 text-white/85">{theme.heroSubtitle}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {quickStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="rounded-[1.1rem] border border-white/15 bg-white/10 p-3 backdrop-blur-xl">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/15">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="mt-3 text-xl font-black tracking-tight">{stat.value}</p>
                      <p className="text-xs text-white/75">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(menuPath)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-[0_18px_38px_rgba(255,255,255,0.18)]"
                >
                  Explore Menu
                  <FiArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleReserveClick}
                  className="inline-flex items-center gap-2 rounded-full border border-white/35 px-4 py-2 text-xs font-semibold text-white"
                >
                  Reserve A Table
                </button>
              </div>
            </div>
            <div className="animate-fade-in-up">
              <div className="relative rounded-[1.5rem] border border-white/15 bg-white/10 p-2.5 backdrop-blur-xl">
                <img src={currentSlide?.image || theme.heroImage} alt={currentSlide?.name || "Hero Dish"} className="h-60 w-full rounded-[1.1rem] object-cover md:h-[19rem]" />
                <div className="absolute left-4 top-4 rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
                  Signature Pick
                </div>
                <div className="absolute inset-x-4 bottom-4 rounded-[1.2rem] border border-white/40 bg-white/88 p-3 text-slate-900 shadow-[0_20px_45px_rgba(15,23,42,0.2)] backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Featured Slider</p>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-base font-black">{currentSlide?.name || "Chef Special"}</p>
                      <p className="text-xs text-slate-600">{currentSlide?.shortDescription || "Freshly prepared premium quality menu item."}</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">Rs {Number(currentSlide?.price || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
              {featuredSlides.length > 1 ? (
                <div className="mt-3 flex justify-center gap-2">
                  {featuredSlides.map((slide, index) => (
                    <button
                      key={`${slide._id || slide.name}-${index}`}
                      onClick={() => setSlideIndex(index)}
                      className={`h-2.5 rounded-full transition-all ${index === slideIndex ? "w-7 bg-white" : "w-2.5 bg-white/50"}`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[112rem] px-3 pb-6 md:px-5">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.5rem] border p-4 md:p-4.5" style={{ borderColor: palette.border, backgroundColor: palette.panelBg, backdropFilter: palette.backdrop, boxShadow: palette.glassShadow }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: palette.muted }}>Food Categories</p>
                <h2 className="mt-1.5 text-2xl font-black" style={{ color: palette.text }}>Browse by craving</h2>
              </div>
              <button
                onClick={() => navigate(menuPath)}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                style={{ backgroundColor: theme.primaryColor }}
              >
                View All
                <FiArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {featuredCategories.map((category) => {
                const Icon = getCategoryIcon(category.name);
                const categoryCount = menuData.items.filter((item) => (item.category?._id || item.category) === category._id).length;
                return (
                  <button
                    key={category._id}
                    onClick={() => openCategoryMenu(category)}
                    className="group rounded-[1.2rem] border p-3 text-left transition-all duration-300 hover:-translate-y-1"
                    style={{ borderColor: palette.border, backgroundColor: palette.cardBg, boxShadow: "0 14px 34px rgba(15,23,42,0.08)" }}
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: theme.primaryColor }}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="mt-3 text-base font-black" style={{ color: palette.text }}>{category.name}</p>
                    <p className="mt-1 text-xs leading-5" style={{ color: palette.muted }}>
                      {category.description || "Tap to open this category in the menu page."}
                    </p>
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: theme.primaryColor }}>
                      {categoryCount} dishes
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.5rem] border p-4 md:p-4.5" style={{ borderColor: palette.border, backgroundColor: palette.panelBg, backdropFilter: palette.backdrop, boxShadow: palette.glassShadow }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: palette.muted }}>Why Guests Choose Us</p>
            <div className="mt-4 space-y-2.5">
              {promiseCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.title} className="rounded-[1.1rem] border p-3" style={{ borderColor: palette.border, backgroundColor: palette.cardBg, boxShadow: "0 14px 34px rgba(15,23,42,0.07)" }}>
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${theme.primaryColor}20`, color: theme.primaryColor }}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="mt-3 text-base font-black" style={{ color: palette.text }}>{card.title}</h3>
                    <p className="mt-1 text-xs leading-5" style={{ color: palette.muted }}>{card.copy}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[112rem] px-3 pb-6 md:px-5">
        <div className="rounded-[1.5rem] border p-4 md:p-4.5" style={{ borderColor: palette.border, backgroundColor: palette.panelBg, backdropFilter: palette.backdrop, boxShadow: palette.glassShadow }}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: palette.muted }}>Top Rated Picks</p>
              <h2 className="mt-1.5 text-2xl font-black" style={{ color: palette.text }}>Dishes customers keep reordering</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {topRatedItems.map((item) => (
              <button
                key={item._id}
                onClick={() => setSelectedItem(item)}
                className="overflow-hidden rounded-[1.25rem] border text-left transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: palette.border, backgroundColor: palette.cardBg, boxShadow: "0 18px 40px rgba(15,23,42,0.1)" }}
              >
                <img src={item.image} alt={item.name} className="h-36 w-full object-cover" />
                <div className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-black" style={{ color: palette.text }}>{item.name}</p>
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold" style={{ backgroundColor: `${theme.primaryColor}18`, color: theme.primaryColor }}>
                      <FiStar className="h-3 w-3" />
                      {Number(item.averageRating || item.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5" style={{ color: palette.muted }}>{item.shortDescription || item.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-black" style={{ color: theme.primaryColor }}>Rs {Number(item.price || 0).toFixed(2)}</span>
                    <span className="text-xs font-semibold" style={{ color: palette.muted }}>{Number(item.reviewCount || 0)} reviews</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <PublicMenuSections
        categories={menuData.categories}
        subCategories={menuData.subCategories}
        items={menuData.items}
        primaryColor={theme.primaryColor}
        isCustomerView={isCustomerView}
        palette={palette}
        onItemTap={onPublicItemTap}
      />

      <footer id="site-footer" className="mt-12">
        <div className="mx-auto w-full max-w-[112rem] overflow-hidden rounded-t-[1.5rem]">
          <div className="space-y-4 px-6 py-12 text-center text-white" style={{ background: `radial-gradient(circle at top center, rgba(255,255,255,0.16), transparent 30%), linear-gradient(120deg, ${theme.secondaryColor}cc 0%, ${theme.primaryColor}cc 100%)` }}>
            <p className="text-xs uppercase tracking-[0.22em] font-bold opacity-90">Book A Table</p>
            <h3 className="heading-1 text-white">Reserve Your Seat Now</h3>
            <p className="mx-auto max-w-2xl text-base text-white/90">Enjoy premium dishes crafted by our chef team. Perfect for families, business meetings and special occasions.</p>
            <button onClick={handleReserveClick} className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600">Reserve Table</button>
          </div>
          <div className="grid gap-8 px-6 py-12 md:grid-cols-4" style={{ backgroundColor: palette.panelBg, color: palette.text }}>
            <div>
              <div className="mb-3 flex items-center gap-2">{theme.logoImage ? <img src={theme.logoImage} alt="logo" className="h-10 w-10 rounded-full object-cover" /> : null}<p className="text-xl font-black">{theme.logoText}</p></div>
              <p className="text-sm" style={{ color: palette.muted }}>{theme.footerNote}</p>
            </div>
            <div>
              <p className="text-lg font-bold">Menu</p>
              <div className="mt-3 space-y-2 text-sm" style={{ color: palette.muted }}>{menuData.categories.slice(0, 5).map((c) => <p key={c._id}>{c.name}</p>)}</div>
            </div>
            <div>
              <p className="text-lg font-bold">Connect</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {[["Facebook", theme.facebookUrl], ["Instagram", theme.instagramUrl], ["YouTube", theme.youtubeUrl], ["Twitter", theme.twitterUrl]].filter((x) => x[1]).map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noreferrer" className="rounded-full border px-3 py-1.5" style={{ borderColor: palette.border }}>{label}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-lg font-bold">Contact</p>
              <div className="mt-3 space-y-2 text-sm" style={{ color: palette.muted }}>
                <p>{theme.addressLine}, {theme.city}, {theme.state}, {theme.country} {theme.postalCode}</p>
                <p>{theme.contactPhone}</p><p>{theme.contactEmail}</p><p>{theme.openingHours}</p>
                {menuData.menuPdf ? <a href={menuData.menuPdf.url} target="_blank" rel="noreferrer" className="inline-block font-semibold underline">Open Menu PDF</a> : null}
              </div>
            </div>
          </div>
        </div>
      </footer>

      <MenuItemQuickViewModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        palette={palette}
        theme={theme}
        onAddToCart={(item) => {
          if (!isAuthenticated || !user?.roles?.includes("customer")) {
            navigate("/auth/login");
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
        }}
      />
    </div>
  );
};

export default Visitor_Home;
