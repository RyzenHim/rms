import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import menuService from "../../services/menu_Service";
import themeService from "../../services/theme_Service";
import { useAuth } from "../../context/AuthContext";
import PublicMenuSections from "../../components/menu/PublicMenuSections";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";

const fallbackTheme = {
  name: "Emerald Bistro",
  logoText: "DelishDrop",
  logoImage: "",
  heroTitle: "Delicious food at your doorstep",
  heroSubtitle: "Freshly crafted meals with lightning fast delivery.",
  heroTagline: "Dynamic Restaurant Website",
  ctaText: "Get Started",
  primaryColor: "#0b6b49",
  secondaryColor: "#ffd54f",
  accentColor: "#1f2937",
  surfaceColor: "#f8faf8",
  heroImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80",
  contactPhone: "+91 99999 99999",
  contactEmail: "hello@delishdrop.com",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { palette, resolvedMode, setUserMode, allowUserThemeToggle } = useResolvedColorMode(theme);

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

  const isAdmin = Boolean(user?.roles?.includes("admin"));
  const currentSlide = featuredSlides[slideIndex];
  const menuPath = isCustomerView ? "/customer/menu" : "/menu";
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

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: palette.pageBg, color: palette.text }}>
      <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="hero-orb-left" style={{ background: `${theme.secondaryColor}80` }} />
          <div className="hero-orb-right" style={{ background: `${theme.primaryColor}80` }} />
        </div>
        <div className="overflow-hidden rounded-[2rem] p-5 text-white md:p-10" style={{ background: `linear-gradient(128deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%)` }}>
          <nav>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {theme.logoImage ? <img src={theme.logoImage} alt="logo" className="h-11 w-11 rounded-full object-cover" /> : null}
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/80">{theme.name}</p>
                  <Link to="/" className="text-2xl font-black">{theme.logoText}</Link>
                </div>
              </div>
              <div className="hidden items-center gap-2 text-sm md:flex">
                <Link to="/" className="rounded-full px-4 py-2 hover:bg-white/15">Home</Link>
                <a href="#full-menu" className="rounded-full px-4 py-2 hover:bg-white/15">Sections</a>
                <Link to={menuPath} className="rounded-full px-4 py-2 hover:bg-white/15">Menu</Link>
                <a href="#site-footer" className="rounded-full px-4 py-2 hover:bg-white/15">Contact</a>
                {isAdmin ? <Link to="/admin" className="rounded-full bg-white/20 px-4 py-2 font-semibold">Admin Panel</Link> : null}
                {allowUserThemeToggle ? (
                  <button onClick={() => setUserMode(resolvedMode === "dark" ? "light" : "dark")} className="rounded-full border border-white/30 px-4 py-2">
                    {resolvedMode === "dark" ? "Light" : "Dark"}
                  </button>
                ) : null}
                {!isAuthenticated ? (
                  <>
                    <Link to="/auth/login" className="rounded-full border border-white/30 px-4 py-2">Login</Link>
                    <Link to="/auth/signup" className="rounded-full px-4 py-2 font-bold text-slate-900" style={{ background: theme.secondaryColor }}>Sign Up</Link>
                  </>
                ) : null}
              </div>
              <button className="rounded-full border border-white/40 px-3 py-2 md:hidden" onClick={() => setMobileMenuOpen((prev) => !prev)} aria-label="Toggle menu">
                {mobileMenuOpen ? "Close" : "Menu"}
              </button>
            </div>
            {mobileMenuOpen ? (
              <div className="mt-3 grid gap-2 rounded-2xl bg-black/20 p-3 text-sm md:hidden">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 hover:bg-white/15">Home</Link>
                <a href="#full-menu" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 hover:bg-white/15">Sections</a>
                <Link to={menuPath} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 hover:bg-white/15">Menu</Link>
                <a href="#site-footer" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-2 hover:bg-white/15">Contact</a>
                {isAdmin ? <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-white/20 px-3 py-2 font-semibold">Admin Panel</Link> : null}
                {allowUserThemeToggle ? (
                  <button onClick={() => setUserMode(resolvedMode === "dark" ? "light" : "dark")} className="rounded-xl border border-white/30 px-3 py-2 text-left">
                    Switch to {resolvedMode === "dark" ? "Light" : "Dark"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </nav>

          <div className="mt-8 grid items-center gap-8 md:grid-cols-2">
            <div className="animate-rise-in">
              <p className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-widest">{theme.heroTagline}</p>
              <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">{theme.heroTitle}</h1>
              <p className="mt-4 max-w-xl text-white/85">{theme.heroSubtitle}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to={menuPath} className="rounded-full px-6 py-3 text-sm font-bold text-slate-900" style={{ backgroundColor: theme.secondaryColor }}>
                  {isCustomerView ? "Order From Menu" : theme.ctaText}
                </Link>
                <a href="#full-menu" className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold">Browse Sections</a>
              </div>
            </div>
            <div className="animate-fade-in-up">
              <div className="relative rounded-[1.8rem] bg-white/10 p-3 backdrop-blur">
                <img src={currentSlide?.image || theme.heroImage} alt={currentSlide?.name || "Hero Dish"} className="h-72 w-full rounded-[1.4rem] object-cover md:h-[25rem]" />
                <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-white/90 p-4 text-slate-900">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Featured Slider</p>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <div><p className="text-lg font-black">{currentSlide?.name || "Chef Special"}</p><p className="text-sm text-slate-600">{currentSlide?.shortDescription || "Freshly prepared premium quality menu item."}</p></div>
                    <p className="text-xl font-black text-slate-900">${Number(currentSlide?.price || 0).toFixed(2)}</p>
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

      <section className="mx-auto max-w-7xl px-4 pb-10 md:px-8">
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]" style={{ border: `1px solid ${palette.border}`, backgroundColor: palette.cardBg }}>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: palette.muted }}>Address</p>
            <p className="mt-2 text-sm font-semibold">{theme.addressLine}, {theme.city}</p>
          </article>
          <article className="rounded-2xl p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]" style={{ border: `1px solid ${palette.border}`, backgroundColor: palette.cardBg }}>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: palette.muted }}>Contact</p>
            <p className="mt-2 text-sm font-semibold">{theme.contactPhone} | {theme.contactEmail}</p>
          </article>
          <article className="rounded-2xl p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]" style={{ border: `1px solid ${palette.border}`, backgroundColor: palette.cardBg }}>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: palette.muted }}>Open Hours</p>
            <p className="mt-2 text-sm font-semibold">{theme.openingHours}</p>
          </article>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[{ label: "Live Categories", value: menuData.categories.length }, { label: "Live Sub-Categories", value: menuData.subCategories.length }, { label: "Total Menu Items", value: menuData.items.length }, { label: "Featured Picks", value: featuredSlides.length }].map((entry, idx) => (
            <article key={entry.label} className="animate-fade-in-up rounded-2xl p-4 shadow-[0_12px_25px_rgba(15,23,42,0.06)]" style={{ animationDelay: `${idx * 90}ms`, border: `1px solid ${palette.border}`, backgroundColor: palette.cardBg }}>
              <p className="text-sm" style={{ color: palette.muted }}>{entry.label}</p><p className="mt-2 text-2xl font-black">{entry.value}</p>
            </article>
          ))}
        </div>
      </section>

      <PublicMenuSections categories={menuData.categories} subCategories={menuData.subCategories} items={menuData.items} primaryColor={theme.primaryColor} isCustomerView={isCustomerView} palette={palette} onItemTap={onPublicItemTap} />

      <footer id="site-footer" className="mt-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-t-[2rem]">
          <div className="px-6 py-12 text-center text-white" style={{ background: `linear-gradient(120deg, ${theme.secondaryColor}cc 0%, ${theme.primaryColor}cc 100%)` }}>
            <p className="text-xs uppercase tracking-[0.22em]">Book A Table</p>
            <h3 className="mt-2 text-4xl font-black">Book A Table Now</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm">Reserve your seat and enjoy premium dishes crafted by our chef team.</p>
            <Link to={menuPath} className="mt-6 inline-block rounded-full bg-orange-500 px-8 py-3 text-sm font-bold text-white">BOOK A TABLE</Link>
          </div>
          <div className="grid gap-8 px-6 py-12 md:grid-cols-4" style={{ backgroundColor: resolvedMode === "dark" ? "#111827" : "#4b4b43", color: "#e5e7eb" }}>
            <div>
              <div className="mb-3 flex items-center gap-2">{theme.logoImage ? <img src={theme.logoImage} alt="logo" className="h-10 w-10 rounded-full object-cover" /> : null}<p className="text-xl font-black">{theme.logoText}</p></div>
              <p className="text-sm text-slate-300">{theme.footerNote}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">Menu</p>
              <div className="mt-3 space-y-2 text-sm text-slate-300">{menuData.categories.slice(0, 5).map((c) => <p key={c._id}>{c.name}</p>)}</div>
            </div>
            <div>
              <p className="text-lg font-bold text-white">Connect</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {[["Facebook", theme.facebookUrl], ["Instagram", theme.instagramUrl], ["YouTube", theme.youtubeUrl], ["Twitter", theme.twitterUrl]].filter((x) => x[1]).map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noreferrer" className="rounded-full border border-white/30 px-3 py-1.5">{label}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-lg font-bold text-white">Contact</p>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
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
