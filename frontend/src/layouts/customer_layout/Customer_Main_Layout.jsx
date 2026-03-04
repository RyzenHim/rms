import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import ProfileHeader from "../../components/ProfileHeader";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";
import { FiMoon, FiSun } from "react-icons/fi";

const Customer_Main_Layout = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { resolvedMode, setUserMode, palette } = useResolvedColorMode({
    colorMode: "system",
    allowUserThemeToggle: true,
    surfaceColor: "#f1f5f9",
  });
  const searchLinks = useMemo(
    () => [
      { to: "/customer", label: "Home" },
      { to: "/customer/menu", label: "Order Tray" },
      { to: "/customer/orders", label: "Orders" },
      { to: "/customer/my-reservations", label: "Reservations" },
      { to: "/customer/reservation-form", label: "Book Table" },
      { to: "/customer/profile", label: "Profile" },
      { to: "/", label: "Public" },
    ],
    [],
  );

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const query = search.trim().toLowerCase();
    if (!query) return;

    const exact = searchLinks.find((item) => item.label.toLowerCase() === query);
    const partial = searchLinks.find((item) => item.label.toLowerCase().includes(query));
    const target = exact || partial;
    if (target) {
      navigate(target.to);
      setSearch("");
      setMobileMenuOpen(false);
    }
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: palette.pageBg, color: palette.text }}>
      <header className="sticky top-0 z-40 border-b backdrop-blur" style={{ borderColor: palette.border, backgroundColor: `${palette.panelBg}E6` }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-4 md:px-8">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 md:flex-none">
            <p className="font-black text-sm sm:text-base truncate" style={{ color: palette.text }}>Customer</p>
            <nav className="hidden items-center gap-0.5 lg:flex">
              <NavLink
                to="/customer"
                end
                className={({ isActive }) =>
                  `rounded-full px-2.5 py-1.5 text-xs sm:text-sm font-semibold ${
                    isActive ? "bg-emerald-700 text-white" : "hover:bg-slate-100"
                  }`
                }
                style={({ isActive }) => (isActive ? undefined : { color: palette.text })}
              >
                Home
              </NavLink>
              <NavLink
                to="/customer/menu"
                className={({ isActive }) =>
                  `rounded-full px-2.5 py-1.5 text-xs sm:text-sm font-semibold ${
                    isActive ? "bg-emerald-700 text-white" : "hover:bg-slate-100"
                  }`
                }
                style={({ isActive }) => (isActive ? undefined : { color: palette.text })}
              >
                Order Tray
              </NavLink>
              <NavLink
                to="/customer/orders"
                className={({ isActive }) =>
                  `rounded-full px-2.5 py-1.5 text-xs sm:text-sm font-semibold ${
                    isActive ? "bg-emerald-700 text-white" : "hover:bg-slate-100"
                  }`
                }
                style={({ isActive }) => (isActive ? undefined : { color: palette.text })}
              >
                Orders
              </NavLink>
              <NavLink
                to="/customer/my-reservations"
                className={({ isActive }) =>
                  `rounded-full px-2.5 py-1.5 text-xs sm:text-sm font-semibold ${
                    isActive ? "bg-emerald-700 text-white" : "hover:bg-slate-100"
                  }`
                }
                style={({ isActive }) => (isActive ? undefined : { color: palette.text })}
              >
                Reservations
              </NavLink>
              <Link to="/" className="rounded-full px-2.5 py-1.5 text-xs sm:text-sm font-semibold hover:bg-slate-100" style={{ color: palette.text }}>
                Public
              </Link>
            </nav>
          </div>

          {/* Search Bar - Hidden on very small screens */}
          <form onSubmit={onSearchSubmit} className="hidden sm:block order-3 w-full md:order-none md:w-64 lg:w-80">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-full border px-3 py-2 text-xs sm:text-sm outline-none transition"
              style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
            />
          </form>

          {/* Desktop Profile & Logout - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setUserMode(resolvedMode === "dark" ? "light" : "dark")}
              className="rounded-full border p-2 transition"
              style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
              title={resolvedMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {resolvedMode === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
            </button>
            <ProfileHeader />
          </div>

          {/* Mobile Theme + Menu Buttons */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setUserMode(resolvedMode === "dark" ? "light" : "dark")}
              className="rounded-full border p-2 transition"
              style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
              title={resolvedMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {resolvedMode === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 transition"
              style={{ color: palette.text }}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t" style={{ borderColor: palette.border, backgroundColor: palette.panelBg }}>
            {/* Mobile Search */}
            <form onSubmit={onSearchSubmit} className="border-b p-3" style={{ borderColor: palette.border }}>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-full border px-3 py-2 text-sm outline-none transition"
                style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
              />
            </form>

            {/* Mobile Navigation */}
            <nav className="flex flex-col">
              <NavLink to="/customer" end onClick={handleNavClick} className={({ isActive }) =>
                  `px-4 py-3 text-sm font-semibold border-b ${
                    isActive ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50"
                  }`
                }>
                Home
              </NavLink>
              <NavLink to="/customer/menu" onClick={handleNavClick} className={({ isActive }) =>
                  `px-4 py-3 text-sm font-semibold border-b ${
                    isActive ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50"
                  }`
                }>
                Order Tray
              </NavLink>
              <NavLink to="/customer/orders" onClick={handleNavClick} className={({ isActive }) =>
                  `px-4 py-3 text-sm font-semibold border-b ${
                    isActive ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50"
                  }`
                }>
                Orders
              </NavLink>
              <NavLink to="/customer/my-reservations" onClick={handleNavClick} className={({ isActive }) =>
                  `px-4 py-3 text-sm font-semibold border-b ${
                    isActive ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50"
                  }`
                }>
                Reservations
              </NavLink>
              <NavLink to="/customer/reservation-form" onClick={handleNavClick} className={({ isActive }) =>
                  `px-4 py-3 text-sm font-semibold border-b ${
                    isActive ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50"
                  }`
                }>
                Book Table
              </NavLink>
              <Link to="/" onClick={handleNavClick} className="border-b px-4 py-3 text-sm font-semibold hover:bg-slate-50" style={{ color: palette.text }}>
                Public Menu
              </Link>
            </nav>

            {/* Mobile Profile & Logout */}
            <div className="border-t p-3" style={{ borderColor: palette.border }}>
              <ProfileHeader />
            </div>
          </div>
        )}
      </header>
      <Outlet />
    </div>
  );
};

export default Customer_Main_Layout;
