import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiLoader, FiLogIn, FiLogOut, FiMenu, FiMoon, FiShoppingCart, FiSun, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const AppNavbar = ({
  brandName = "DelishDrop",
  brandSub = "",
  logoImage = "",
  links = [],
  palette,
  resolvedMode,
  setUserMode,
  allowUserThemeToggle = true,
  showGuestAuth = false,
  trayItems = [],
  trayItemCount = 0,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isTrayHovering, setIsTrayHovering] = useState(false);
  const [isTrayPreviewReady, setIsTrayPreviewReady] = useState(false);
  const hoverTimerRef = useRef(null);

  const navLinks = useMemo(() => links.filter((link) => Boolean(link && link.to !== "/customer/menu")), [links]);
  const compactTrayItems = useMemo(() => trayItems.slice(0, 4), [trayItems]);

  const onLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/auth/login");
  };

  useEffect(() => () => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
    }
  }, []);

  const openTrayPage = () => {
    setIsTrayHovering(false);
    setIsTrayPreviewReady(false);
    if (location.pathname === "/customer/menu") {
      const traySection = document.getElementById("order-tray");
      traySection?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    navigate("/customer/menu#order-tray");
  };

  const onTrayMouseEnter = () => {
    if (!trayItems.length) return;
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    setIsTrayHovering(true);
    setIsTrayPreviewReady(false);
    hoverTimerRef.current = window.setTimeout(() => {
      setIsTrayPreviewReady(true);
    }, 450);
  };

  const onTrayMouseLeave = () => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    setIsTrayHovering(false);
    setIsTrayPreviewReady(false);
  };

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur"
      style={{ borderColor: palette.border, backgroundColor: palette.panelBg, backdropFilter: palette.backdrop, boxShadow: palette.glassShadow }}
    >
      <div className="mx-auto grid w-full max-w-[112rem] grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-3 md:px-5">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          {logoImage ? <img src={logoImage} alt="logo" className="h-10 w-10 rounded-full object-cover" /> : null}
          <div className="min-w-0">
            {brandSub ? (
              <p className="truncate text-[10px] uppercase tracking-[0.2em]" style={{ color: palette.muted }}>
                {brandSub}
              </p>
            ) : null}
            <p className="truncate text-lg font-black uppercase italic tracking-[0.12em]">{brandName}</p>
          </div>
        </Link>

        <nav className="hidden items-center justify-center gap-2 overflow-x-auto md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-all"
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: palette.cardBg, color: palette.text, border: `1px solid ${palette.border}`, boxShadow: palette.glassShadow }
                  : { color: palette.text, backgroundColor: "transparent" }
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <div className="relative" onMouseEnter={onTrayMouseEnter} onMouseLeave={onTrayMouseLeave}>
              <button
                onClick={openTrayPage}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all"
                style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.cardBg, backdropFilter: palette.backdrop }}
              >
                <span className="relative inline-flex h-5 w-5 items-center justify-center">
                  <FiShoppingCart className="h-4 w-4" />
                  <span
                    className="absolute -right-2.5 -top-2.5 inline-flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full px-1 text-center text-[10px] font-bold leading-none text-white"
                    style={{ backgroundColor: palette.primary }}
                  >
                    {trayItemCount}
                  </span>
                </span>
                Tray
              </button>

              {isTrayHovering ? (
                <div
                  className="absolute right-0 mt-3 w-80 rounded-2xl border p-3 shadow-2xl"
                  style={{ borderColor: palette.border, backgroundColor: palette.panelBg, backdropFilter: palette.backdrop, boxShadow: palette.glassShadow }}
                >
                  {!isTrayPreviewReady ? (
                    <div className="flex items-center gap-2 px-1 py-4 text-sm font-semibold" style={{ color: palette.muted }}>
                      <FiLoader className="h-4 w-4 animate-spin" />
                      Loading tray...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-sm font-black" style={{ color: palette.text }}>Order Tray</p>
                        <span className="text-xs font-semibold" style={{ color: palette.muted }}>
                          {trayItemCount} items
                        </span>
                      </div>
                      {compactTrayItems.map((item) => (
                        <div
                          key={item.menuItem}
                          className="flex items-center gap-3 rounded-xl border px-2.5 py-2"
                          style={{ borderColor: palette.border, backgroundColor: palette.cardBg, backdropFilter: palette.backdrop }}
                        >
                          <img
                            src={item.image || "https://via.placeholder.com/48x48?text=Dish"}
                            alt={item.name}
                            className="h-11 w-11 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold" style={{ color: palette.text }}>{item.name}</p>
                            <p className="text-xs" style={{ color: palette.muted }}>
                              Qty {item.quantity} | Rs {(Number(item.unitPrice || 0) * Number(item.quantity || 0)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {trayItems.length > compactTrayItems.length ? (
                        <p className="px-1 text-xs font-semibold" style={{ color: palette.muted }}>
                          +{trayItems.length - compactTrayItems.length} more items
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {allowUserThemeToggle ? (
            <button
              onClick={() => setUserMode(resolvedMode === "dark" ? "light" : "dark")}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all"
              style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.cardBg, backdropFilter: palette.backdrop }}
            >
              {resolvedMode === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
              {resolvedMode === "dark" ? "Light" : "Dark"}
            </button>
          ) : null}

          {!isAuthenticated && showGuestAuth ? (
            <>
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all"
                style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.cardBg, backdropFilter: palette.backdrop }}
              >
                <FiLogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                to="/auth/signup"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg"
                style={{ backgroundColor: palette.primary, boxShadow: palette.glassShadow }}
              >
                Sign Up
              </Link>
            </>
          ) : null}

          {isAuthenticated ? (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg"
              style={{ backgroundColor: palette.secondary, boxShadow: palette.glassShadow }}
            >
              <FiLogOut className="h-4 w-4" />
              Logout
            </button>
          ) : null}
        </div>

        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm md:hidden"
          style={{ borderColor: palette.border, backgroundColor: palette.cardBg, backdropFilter: palette.backdrop }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <FiX className="h-4 w-4" /> : <FiMenu className="h-4 w-4" />}
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>

      {mobileOpen ? (
        <div className="space-y-2 border-t p-3 md:hidden" style={{ borderColor: palette.border, backgroundColor: palette.panelBg, backdropFilter: palette.backdrop }}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: palette.cardBg, color: palette.text, border: `1px solid ${palette.border}` }
                  : { color: palette.text, backgroundColor: "transparent" }
              }
            >
              {link.label}
            </NavLink>
          ))}

          {allowUserThemeToggle ? (
            <button
              onClick={() => setUserMode(resolvedMode === "dark" ? "light" : "dark")}
              className="inline-flex w-full items-center gap-2 rounded-xl border px-3 py-1.5 text-left text-xs font-semibold transition-all"
              style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.cardBg }}
            >
              {resolvedMode === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
              {resolvedMode === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
          ) : null}

          {!isAuthenticated && showGuestAuth ? (
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all"
                style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.cardBg }}
              >
                <FiLogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                to="/auth/signup"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all"
                style={{ backgroundColor: palette.primary }}
              >
                Sign Up
              </Link>
            </div>
          ) : null}

          {isAuthenticated ? (
            <button
              onClick={onLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all"
              style={{ backgroundColor: palette.secondary }}
            >
              <FiLogOut className="h-4 w-4" />
              Logout
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
};

export default AppNavbar;
