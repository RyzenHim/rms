import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import menuService from "../../services/menu_Service";
import themeService from "../../services/theme_Service";
import { useAuth } from "../../context/AuthContext";
import PublicMenuSections from "../../components/menu/PublicMenuSections";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";

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
  const [theme, setTheme] = useState(fallbackTheme);
  const [menuData, setMenuData] = useState({ categories: [], subCategories: [], items: [], menuPdf: null });
  const [slideIndex, setSlideIndex] = useState(0);
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

  const menuPath = isCustomerView ? "/customer/menu" : "#full-menu";
  const reservationPath = isCustomerView ? "/customer/reservation-form" : "/auth/login";
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

  const handleReserveClick = () => {
    if (!isAuthenticated) {
      navigate("/auth/login", { state: { from: "/customer/reservation-form" } });
      return;
    }
    if (user?.roles?.includes("customer")) {
      navigate("/customer/reservation-form");
      return;
    }
    navigate("/dashboard");
  };

  const currentSlide = featuredSlides[slideIndex];

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: palette.pageBg, color: palette.text }}>
      <section className="relative mx-auto w-full max-w-[96rem] px-4 pb-10 pt-6 md:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="hero-orb-left" style={{ background: `${theme.secondaryColor}80` }} />
          <div className="hero-orb-right" style={{ background: `${theme.primaryColor}80` }} />
        </div>
        <div
          className="overflow-hidden rounded-[2rem] p-5 text-white md:p-10"
          style={{ background: `linear-gradient(128deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%)` }}
        >
          <div className="mt-8 grid items-center gap-8 md:grid-cols-2">
            <div className="animate-rise-in space-y-6">
              <div className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs uppercase tracking-widest backdrop-blur">{theme.heroTagline}</div>
              <h1 className="heading-1 text-white leading-tight">{theme.heroTitle}</h1>
              <p className="text-lg text-white/85 max-w-xl">{theme.heroSubtitle}</p>
            </div>
            <div className="animate-fade-in-up">
              <div className="relative rounded-[1.8rem] bg-white/10 p-3 backdrop-blur">
                <img src={currentSlide?.image || theme.heroImage} alt={currentSlide?.name || "Hero Dish"} className="h-72 w-full rounded-[1.4rem] object-cover md:h-[25rem]" />
                <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-white/90 p-4 text-slate-900">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Featured Slider</p>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-lg font-black">{currentSlide?.name || "Chef Special"}</p>
                      <p className="text-sm text-slate-600">{currentSlide?.shortDescription || "Freshly prepared premium quality menu item."}</p>
                    </div>
                    <p className="text-xl font-black text-slate-900">Rs {Number(currentSlide?.price || 0).toFixed(2)}</p>
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

      <PublicMenuSections
        categories={menuData.categories}
        subCategories={menuData.subCategories}
        items={menuData.items}
        primaryColor={theme.primaryColor}
        isCustomerView={isCustomerView}
        palette={palette}
        onItemTap={onPublicItemTap}
      />

      <footer id="site-footer" className="mt-10">
        <div className="mx-auto w-full max-w-[96rem] overflow-hidden rounded-t-[2rem]">
          <div className="px-6 py-12 text-center text-white space-y-4" style={{ background: `linear-gradient(120deg, ${theme.secondaryColor}cc 0%, ${theme.primaryColor}cc 100%)` }}>
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
    </div>
  );
};

export default Visitor_Home;
