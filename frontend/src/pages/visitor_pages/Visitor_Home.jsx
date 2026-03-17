import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  FiArrowRight,
  FiAward,
  FiClock,
  FiCoffee,
  FiGrid,
  FiHeart,
  FiMinus,
  FiPlus,
  FiStar,
  FiTrash2,
  FiTruck,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
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
  heroImage:
    "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80",
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

const PanelCard = ({ children, className = "", palette, style = {} }) => (
  <div
    className={`rounded-[1.5rem] border ${className}`}
    style={{
      backgroundColor: palette.panelBg,
      borderColor: palette.border,
      backdropFilter: palette.backdrop,
      WebkitBackdropFilter: palette.backdrop,
      boxShadow: palette.glassShadow,
      ...style,
    }}
  >
    {children}
  </div>
);

const getCategoryIcon = (categoryName = "") => {
  const normalized = categoryName.toLowerCase();
  if (normalized.includes("drink") || normalized.includes("beverage")) return FiCoffee;
  if (normalized.includes("snack")) return FiStar;
  return FiGrid;
};

const Visitor_Home = ({ isCustomerView = false }) => {
  const navigate = useNavigate();
  const { theme: sharedTheme, menuData = { categories: [], subCategories: [], items: [], menuPdf: null } } = useOutletContext() || {};
  const { isAuthenticated, user } = useAuth();
  const { cart, setCart } = useOrderTray();
  const [slideIndex, setSlideIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const theme = { ...fallbackTheme, ...(sharedTheme || {}) };
  const { palette } = useResolvedColorMode(theme);

  const featuredSlides = useMemo(() => {
    const featured = menuData.items.filter((item) => item.isFeatured).slice(0, 5);
    return featured.length ? featured : menuData.items.slice(0, 5);
  }, [menuData.items]);

  const canAddToTray = isCustomerView || (isAuthenticated && user?.roles?.includes("customer"));
  const menuPath = canAddToTray ? "/customer/menu" : "/menu";

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

  const handleAddToCart = (item) => {
    if (!isAuthenticated || !user?.roles?.includes("customer")) {
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

  const handleIncrementCart = (item) => handleAddToCart(item);

  const handleDecrementCart = (item) => {
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

  const handleRemoveCart = (menuItemId) => {
    if (!canAddToTray) {
      navigate("/auth/login");
      return;
    }
    setCart((prev) => prev.filter((entry) => entry.menuItem !== menuItemId));
  };

  const getCartQuantity = (itemId) => Number(cart.find((entry) => entry.menuItem === itemId)?.quantity || 0);

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

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: palette.pageBg, color: palette.text }}>
      <section className="relative mx-auto w-full max-w-[112rem] px-3 pb-8 pt-5 md:px-6">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-20 -top-12 h-[28rem] w-[28rem] rounded-full blur-[100px]" style={{ background: `${theme.secondaryColor}55` }} />
          <div className="absolute -right-16 top-8 h-[24rem] w-[24rem] rounded-full blur-[90px]" style={{ background: `${theme.primaryColor}45` }} />
        </div>

        <div
          className="relative overflow-hidden rounded-[2rem] border p-5 text-white md:p-8"
          style={{
            background: `radial-gradient(ellipse at top right, rgba(255,255,255,0.22), transparent 28%), linear-gradient(130deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%)`,
            borderColor: "rgba(255,255,255,0.18)",
            boxShadow: "0 40px 90px rgba(15,23,42,0.28), inset 0 1px 0 rgba(255,255,255,0.22)",
          }}
        >
          <span aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/08" />

          <div className="grid items-start gap-6 md:grid-cols-[1fr_0.88fr]">
            <div className="animate-rise-in space-y-5 md:pr-4">
              <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] backdrop-blur-sm">
                {theme.heroTagline}
              </span>

              <h1 className="text-[clamp(1.9rem,4vw,3.1rem)] font-black leading-[1.03] tracking-tight text-white">
                {theme.heroTitle}
              </h1>
              <p className="max-w-xl text-sm leading-6 text-white/80">
                {theme.heroSubtitle}
              </p>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {quickStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="rounded-[1.1rem] border border-white/15 bg-white/10 p-3 backdrop-blur-xl">
                      <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/15">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="mt-2 text-lg font-black tracking-tight">{stat.value}</p>
                      <p className="text-[11px] text-white/70">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={() => navigate(menuPath)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-slate-900 shadow-[0_16px_36px_rgba(255,255,255,0.22)] transition-transform duration-200 hover:scale-[1.03] active:scale-95"
                >
                  Explore Menu
                  <FiArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleReserveClick}
                  className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/08 px-5 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition-transform duration-200 hover:bg-white/15 active:scale-95"
                >
                  Reserve A Table
                </button>
              </div>
            </div>

            <div className="animate-fade-in-up self-start md:pl-2">
              <div className="relative mx-auto w-full max-w-[34rem] rounded-[1.5rem] border border-white/18 bg-white/10 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl md:ml-auto">
                <div className="absolute left-5 top-5 z-10 rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                  Signature Pick
                </div>

                <img
                  key={currentSlide?._id || slideIndex}
                  src={currentSlide?.image || theme.heroImage}
                  alt={currentSlide?.name || "Hero Dish"}
                  className="h-56 w-full rounded-[1.1rem] object-cover transition-opacity duration-700 md:h-[18rem] xl:h-[19rem]"
                />

                <div className="absolute inset-x-4 bottom-4 z-10 rounded-[1.1rem] border border-white/50 bg-white/88 p-3 text-slate-900 shadow-[0_18px_44px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Featured Today</p>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-black leading-5 text-slate-900">{currentSlide?.name || "Chef Special"}</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                        {currentSlide?.shortDescription || "Freshly prepared premium quality item."}
                      </p>
                    </div>
                    <p className="shrink-0 text-base font-black text-slate-900">Rs {Number(currentSlide?.price || 0).toFixed(2)}</p>
                  </div>
                </div>

                {featuredSlides.length > 1 ? (
                  <>
                    <button
                      onClick={() => setSlideIndex((prev) => (prev - 1 + featuredSlides.length) % featuredSlides.length)}
                      className="absolute left-5 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-black/25 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/40"
                      aria-label="Previous slide"
                    >
                      <FiChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSlideIndex((prev) => (prev + 1) % featuredSlides.length)}
                      className="absolute right-5 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-black/25 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/40"
                      aria-label="Next slide"
                    >
                      <FiChevronRight className="h-4 w-4" />
                    </button>
                  </>
                ) : null}
              </div>

              {featuredSlides.length > 1 ? (
                <div className="mt-3 flex justify-center gap-2">
                  {featuredSlides.map((slide, idx) => (
                    <button
                      key={`${slide._id || slide.name}-${idx}`}
                      onClick={() => setSlideIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${idx === slideIndex ? "w-7 bg-white" : "w-2 bg-white/40 hover:bg-white/65"}`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[112rem] px-3 pb-8 md:px-6">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <PanelCard palette={palette} className="p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: palette.muted }}>Food Categories</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight" style={{ color: palette.text }}>Browse by craving</h2>
              </div>
              <button
                onClick={() => navigate(menuPath)}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-white shadow-md transition-transform hover:scale-[1.04] active:scale-95"
                style={{ backgroundColor: theme.primaryColor }}
              >
                View All
                <FiArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {featuredCategories.map((category) => {
                const Icon = getCategoryIcon(category.name);
                const count = menuData.items.filter((item) => (item.category?._id || item.category) === category._id).length;
                return (
                  <button
                    key={category._id}
                    onClick={() => navigate(`${menuPath}?category=${category.slug}`)}
                    className="group rounded-[1.25rem] border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    style={{ borderColor: palette.border, backgroundColor: palette.cardBg, boxShadow: "0 4px 20px rgba(15,23,42,0.06)" }}
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: theme.primaryColor }}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="mt-3 text-[15px] font-black leading-tight" style={{ color: palette.text }}>{category.name}</p>
                    <p className="mt-1 text-[12px] leading-5" style={{ color: palette.muted }}>
                      {category.description || "Tap to open this category in the menu page."}
                    </p>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: theme.primaryColor }}>{count} dishes</p>
                  </button>
                );
              })}
            </div>
          </PanelCard>

          <PanelCard palette={palette} className="p-5 md:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: palette.muted }}>Why Guests Choose Us</p>
            <div className="mt-4 space-y-3">
              {promiseCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.title}
                    className="rounded-[1.1rem] border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    style={{ borderColor: palette.border, backgroundColor: palette.cardBg, boxShadow: "0 4px 18px rgba(15,23,42,0.06)" }}
                  >
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${theme.primaryColor}1a`, color: theme.primaryColor }}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="mt-2.5 text-[15px] font-black" style={{ color: palette.text }}>{card.title}</h3>
                    <p className="mt-1 text-[12px] leading-5" style={{ color: palette.muted }}>{card.copy}</p>
                  </article>
                );
              })}
            </div>
          </PanelCard>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[112rem] px-3 pb-8 md:px-6">
        <PanelCard palette={palette} className="p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: palette.muted }}>Top Rated Picks</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight" style={{ color: palette.text }}>Dishes customers keep reordering</h2>
            </div>
          </div>

          <div className="mt-5 grid items-start gap-3 md:grid-cols-2 xl:grid-cols-4">
            {topRatedItems.map((item) => (
              <article
                key={item._id}
                onClick={() => setSelectedItem(item)}
                className="group flex h-full flex-col overflow-hidden rounded-[1.15rem] border text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ borderColor: palette.border, backgroundColor: palette.cardBg, boxShadow: "0 6px 28px rgba(15,23,42,0.08)" }}
              >
                <div className="relative overflow-hidden">
                  <img src={item.image} alt={item.name} className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span
                    className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold shadow-sm backdrop-blur-sm"
                    style={{ backgroundColor: `${theme.primaryColor}ee`, color: "#fff" }}
                  >
                    <FiStar className="h-3 w-3" />
                    {Number(item.averageRating || item.rating || 0).toFixed(1)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <p className="text-[13px] font-black leading-5" style={{ color: palette.text }}>{item.name}</p>
                  <p className="mt-1 flex-1 text-[11px] leading-4" style={{ color: palette.muted }}>{item.shortDescription || item.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[13px] font-black" style={{ color: theme.primaryColor }}>Rs {Number(item.price || 0).toFixed(2)}</span>
                    <span className="text-[11px] font-medium" style={{ color: palette.muted }}>{Number(item.reviewCount || 0)} reviews</span>
                  </div>
                  {canAddToTray ? (
                    <div className="mt-3 flex items-center gap-2">
                      {getCartQuantity(item._id) > 0 ? (
                        <>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDecrementCart(item);
                            }}
                            className="rounded-xl px-3 py-2 text-xs font-bold text-white"
                            style={{ backgroundColor: theme.primaryColor }}
                          >
                            <FiMinus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleIncrementCart(item);
                            }}
                            className="flex-1 rounded-xl px-3 py-2 text-xs font-bold text-white"
                            style={{ backgroundColor: theme.primaryColor }}
                          >
                            In Tray: {getCartQuantity(item._id)} • Add More
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveCart(item._id);
                            }}
                            className="rounded-xl border px-3 py-2"
                            style={{ borderColor: palette.border, backgroundColor: palette.panelBg, color: palette.text }}
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleAddToCart(item);
                          }}
                          className="w-full rounded-xl px-3 py-2 text-xs font-bold text-white"
                          style={{ backgroundColor: theme.primaryColor }}
                        >
                          <FiPlus className="mr-1 inline h-3.5 w-3.5" />
                          Add To Order Tray
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </PanelCard>
      </section>

      <PublicMenuSections
        categories={menuData.categories}
        subCategories={menuData.subCategories}
        items={menuData.items}
        primaryColor={theme.primaryColor}
        isCustomerView={canAddToTray}
        palette={palette}
        cartItems={cart}
        showTrayActions={canAddToTray}
        onAddToCart={handleAddToCart}
        onIncrementItem={handleIncrementCart}
        onDecrementItem={handleDecrementCart}
        onRemoveItem={handleRemoveCart}
        onItemTap={(item) => setSelectedItem(item)}
      />

      <footer id="site-footer" className="mt-12">
        <div className="mx-auto w-full max-w-[112rem] overflow-hidden rounded-t-[2rem]">
          <div
            className="relative overflow-hidden px-6 py-14 text-center text-white"
            style={{
              background: `radial-gradient(ellipse at top center, rgba(255,255,255,0.18) 0%, transparent 32%), linear-gradient(125deg, ${theme.secondaryColor}cc 0%, ${theme.primaryColor}cc 100%)`,
            }}
          >
            <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] opacity-85">Book A Table</p>
            <h3 className="mt-3 text-[clamp(1.6rem,3vw,2.6rem)] font-black leading-tight text-white">Reserve Your Seat Now</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/85">
              Enjoy premium dishes crafted by our chef team. Perfect for families, business meetings and special occasions.
            </p>
            <button
              onClick={handleReserveClick}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-slate-900 shadow-[0_12px_30px_rgba(0,0,0,0.2)] transition-transform hover:scale-[1.04] active:scale-95"
            >
              Reserve Table
              <FiArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div
            className="grid gap-8 px-6 py-12 md:grid-cols-4"
            style={{ backgroundColor: palette.panelBg, color: palette.text, borderTop: `1px solid ${palette.border}` }}
          >
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                {theme.logoImage ? <img src={theme.logoImage} alt="logo" className="h-10 w-10 rounded-full object-cover" /> : null}
                <p className="text-xl font-black">{theme.logoText}</p>
              </div>
              <p className="text-sm leading-6" style={{ color: palette.muted }}>{theme.footerNote}</p>
            </div>

            <div>
              <p className="text-base font-bold">Menu</p>
              <div className="mt-3 space-y-2 text-sm" style={{ color: palette.muted }}>
                {menuData.categories.slice(0, 5).map((category) => <p key={category._id}>{category.name}</p>)}
              </div>
            </div>

            <div>
              <p className="text-base font-bold">Connect</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["Facebook", theme.facebookUrl],
                  ["Instagram", theme.instagramUrl],
                  ["YouTube", theme.youtubeUrl],
                  ["Twitter", theme.twitterUrl],
                ]
                  .filter(([, url]) => url)
                  .map(([label, url]) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:border-current"
                      style={{ borderColor: palette.border, color: palette.muted }}
                    >
                      {label}
                    </a>
                  ))}
              </div>
            </div>

            <div>
              <p className="text-base font-bold">Contact</p>
              <div className="mt-3 space-y-1.5 text-sm" style={{ color: palette.muted }}>
                <p>{theme.addressLine}, {theme.city}, {theme.state}, {theme.country} {theme.postalCode}</p>
                <p>{theme.contactPhone}</p>
                <p>{theme.contactEmail}</p>
                <p>{theme.openingHours}</p>
                {menuData.menuPdf ? (
                  <a href={menuData.menuPdf.url} target="_blank" rel="noreferrer" className="inline-block font-semibold underline" style={{ color: theme.primaryColor }}>
                    Open Menu PDF
                  </a>
                ) : null}
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
        onAddToCart={handleAddToCart}
        onIncrementItem={handleIncrementCart}
        onDecrementItem={handleDecrementCart}
        onRemoveItem={handleRemoveCart}
        cartItems={cart}
      />
    </div>
  );
};

export default Visitor_Home;
