import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiLogIn, FiLogOut, FiMenu, FiMoon, FiSun, FiX } from "react-icons/fi";
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
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = useMemo(() => links.filter(Boolean), [links]);

  const onLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/auth/login");
  };

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur"
      style={{ borderColor: palette.border, backgroundColor: `${palette.panelBg}E6` }}
    >
      <div className="mx-auto grid w-full max-w-[96rem] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 md:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          {logoImage ? <img src={logoImage} alt="logo" className="h-10 w-10 rounded-full object-cover" /> : null}
          <div className="min-w-0">
            {brandSub ? (
              <p className="truncate text-[10px] uppercase tracking-[0.22em]" style={{ color: palette.muted }}>
                {brandSub}
              </p>
            ) : null}
            <p className="truncate text-lg font-black uppercase italic tracking-[0.14em]">{brandName}</p>
          </div>
        </Link>

        <nav className="hidden items-center justify-center gap-2 overflow-x-auto md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold ${isActive ? "bg-emerald-700 text-white" : ""}`
              }
              style={({ isActive }) =>
                isActive ? undefined : { color: palette.text, backgroundColor: "transparent" }
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
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

          {!isAuthenticated && showGuestAuth ? (
            <>
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
                style={{ borderColor: palette.border }}
              >
                <FiLogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                to="/auth/signup"
                className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Sign Up
              </Link>
            </>
          ) : null}

          {isAuthenticated ? (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <FiLogOut className="h-4 w-4" />
              Logout
            </button>
          ) : null}
        </div>

        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm md:hidden"
          style={{ borderColor: palette.border }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <FiX className="h-4 w-4" /> : <FiMenu className="h-4 w-4" />}
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>

      {mobileOpen ? (
        <div className="space-y-2 border-t p-3 md:hidden" style={{ borderColor: palette.border }}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm font-semibold"
              style={{ color: palette.text }}
            >
              {link.label}
            </NavLink>
          ))}

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

          {!isAuthenticated && showGuestAuth ? (
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"
                style={{ borderColor: palette.border }}
              >
                <FiLogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                to="/auth/signup"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
              >
                Sign Up
              </Link>
            </div>
          ) : null}

          {isAuthenticated ? (
            <button
              onClick={onLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
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
