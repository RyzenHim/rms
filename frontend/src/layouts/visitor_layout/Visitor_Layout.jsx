import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FiLogIn, FiMenu, FiMoon, FiSun, FiX } from "react-icons/fi";
import themeService from "../../services/theme_Service";
import { useAuth } from "../../context/AuthContext";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";

const fallbackTheme = {
  name: "Feane Restaurant",
  logoText: "Feane",
  logoImage: "",
  primaryColor: "#ff8c3a",
  secondaryColor: "#ffd700",
  accentColor: "#292524",
  surfaceColor: "#fafaf9",
  colorMode: "system",
  allowUserThemeToggle: true,
};

const Visitor_Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, getPrimaryRole } = useAuth();
  const [theme, setTheme] = useState(fallbackTheme);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { palette, resolvedMode, setUserMode, allowUserThemeToggle } = useResolvedColorMode(theme);

  useEffect(() => {
    themeService
      .getActiveTheme()
      .then((res) => setTheme((prev) => ({ ...prev, ...res.theme })))
      .catch(() => {});
  }, []);

  const primaryRole = getPrimaryRole(user?.roles || []);
  const routeByRole = {
    admin: "/admin",
    manager: "/manager",
    kitchen: "/kitchen",
    cashier: "/cashier",
    waiter: "/waiter",
  };
  const dashboardPath = routeByRole[primaryRole] || "/dashboard";

  const handleContactClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname !== "/") navigate("/");
    setTimeout(() => {
      document.getElementById("site-footer")?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: palette.pageBg, color: palette.text }}>
      <header className="sticky top-0 z-50 border-b backdrop-blur" style={{ borderColor: palette.border, backgroundColor: `${palette.panelBg}E6` }}>
        <div className="mx-auto grid w-full max-w-[96rem] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 md:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3 justify-self-start">
            {theme.logoImage ? <img src={theme.logoImage} alt="logo" className="h-10 w-10 rounded-full object-cover" /> : null}
            <div className="min-w-0">
              <p className="truncate text-[10px] uppercase tracking-[0.22em]" style={{ color: palette.muted }}>{theme.name}</p>
              <p className="truncate text-lg font-black uppercase italic tracking-[0.14em]">{theme.logoText}</p>
            </div>
          </Link>

          <nav className="hidden items-center justify-center gap-2 md:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `rounded-full px-5 py-2 text-sm font-semibold ${isActive ? "bg-emerald-700 text-white" : ""}`}
              style={({ isActive }) => (isActive ? undefined : { color: palette.text, backgroundColor: "transparent" })}
            >
              Home
            </NavLink>
            <NavLink
              to="/menu"
              className={({ isActive }) => `rounded-full px-5 py-2 text-sm font-semibold ${isActive ? "bg-emerald-700 text-white" : ""}`}
              style={({ isActive }) => (isActive ? undefined : { color: palette.text, backgroundColor: "transparent" })}
            >
              Menu
            </NavLink>
            <a
              href="/#site-footer"
              onClick={handleContactClick}
              className="rounded-full px-5 py-2 text-sm font-semibold"
              style={{ color: palette.text, backgroundColor: "transparent" }}
            >
              Contact
            </a>
          </nav>

          <div className="hidden items-center justify-self-end gap-2 md:flex">
            {allowUserThemeToggle ? (
              <button
                onClick={() => setUserMode(resolvedMode === "dark" ? "light" : "dark")}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
                style={{ borderColor: palette.border }}
              >
                {resolvedMode === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
                {resolvedMode === "dark" ? "Light" : "Dark"}
              </button>
            ) : null}

            {!isAuthenticated ? (
              <>
                <Link to="/auth/login" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: palette.border }}>
                  <FiLogIn className="h-4 w-4" />
                  Login
                </Link>
                <Link to="/auth/signup" className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: theme.secondaryColor, color: theme.accentColor }}>
                  Sign Up
                </Link>
              </>
            ) : user?.roles?.includes("customer") ? (
              <Link to="/customer/menu" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: theme.primaryColor }}>
                Order Tray
              </Link>
            ) : (
              <Link to={dashboardPath} className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: theme.primaryColor }}>
                Dashboard
              </Link>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm md:hidden"
            style={{ borderColor: palette.border }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX className="h-4 w-4" /> : <FiMenu className="h-4 w-4" />}
            {mobileMenuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="space-y-2 border-t p-3 md:hidden" style={{ borderColor: palette.border }}>
            <NavLink to="/" end onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-semibold" style={{ color: palette.text }}>Home</NavLink>
            <NavLink to="/menu" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-semibold" style={{ color: palette.text }}>Menu</NavLink>
            <a href="/#site-footer" onClick={handleContactClick} className="block rounded-xl px-3 py-2 text-sm font-semibold" style={{ color: palette.text }}>Contact</a>
            {allowUserThemeToggle ? (
              <button
                onClick={() => setUserMode(resolvedMode === "dark" ? "light" : "dark")}
                className="inline-flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold"
                style={{ borderColor: palette.border }}
              >
                {resolvedMode === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
                {resolvedMode === "dark" ? "Light Mode" : "Dark Mode"}
              </button>
            ) : null}
            {!isAuthenticated ? (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)} className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold" style={{ borderColor: palette.border }}>
                  <FiLogIn className="h-4 w-4" />
                  Login
                </Link>
                <Link
                  to="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold"
                  style={{ backgroundColor: theme.secondaryColor, color: theme.accentColor }}
                >
                  Sign Up
                </Link>
              </div>
            ) : user?.roles?.includes("customer") ? (
              <Link to="/customer/menu" onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: theme.primaryColor }}>
                Order Tray
              </Link>
            ) : (
              <Link to={dashboardPath} onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: theme.primaryColor }}>
                Dashboard
              </Link>
            )}
          </div>
        ) : null}
      </header>
      <Outlet />
    </div>
  );
};

export default Visitor_Layout;
