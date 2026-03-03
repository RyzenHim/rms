import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProfileHeader from "../../components/ProfileHeader";

const Customer_Main_Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initials = String(user?.name || "U")
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const searchLinks = useMemo(
    () => [
      { to: "/customer", label: "Home" },
      { to: "/customer/menu", label: "Order Tray" },
      { to: "/customer/orders", label: "Orders" },
      { to: "/customer/my-reservations", label: "Reservations" },
      { to: "/customer/reservation-form", label: "Book Table" },
      { to: "/customer/profile", label: "Profile" },
      { to: "/menu", label: "Public" },
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
    <div>
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-4 md:px-8">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 md:flex-none">
            <p className="font-black text-sm sm:text-base text-emerald-800 truncate">Customer</p>
            <nav className="hidden items-center gap-0.5 lg:flex">
              <NavLink
                to="/customer"
                end
                className={({ isActive }) =>
                  `rounded-full px-2.5 py-1.5 text-xs sm:text-sm font-semibold ${
                    isActive ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/customer/menu"
                className={({ isActive }) =>
                  `rounded-full px-2.5 py-1.5 text-xs sm:text-sm font-semibold ${
                    isActive ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                Order Tray
              </NavLink>
              <NavLink
                to="/customer/orders"
                className={({ isActive }) =>
                  `rounded-full px-2.5 py-1.5 text-xs sm:text-sm font-semibold ${
                    isActive ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                Orders
              </NavLink>
              <NavLink
                to="/customer/my-reservations"
                className={({ isActive }) =>
                  `rounded-full px-2.5 py-1.5 text-xs sm:text-sm font-semibold ${
                    isActive ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                Reservations
              </NavLink>
              <Link to="/menu" className="rounded-full px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100">
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
              className="w-full rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs sm:text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
            />
          </form>

          {/* Desktop Profile & Logout - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <ProfileHeader />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-emerald-100 bg-white">
            {/* Mobile Search */}
            <form onSubmit={onSearchSubmit} className="p-3 border-b border-emerald-100">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
              />
            </form>

            {/* Mobile Navigation */}
            <nav className="flex flex-col">
              <NavLink to="/customer" end onClick={handleNavClick} className={({ isActive }) =>
                  `px-4 py-3 text-sm font-semibold border-b border-emerald-100 ${
                    isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                  }`
                }>
                Home
              </NavLink>
              <NavLink to="/customer/menu" onClick={handleNavClick} className={({ isActive }) =>
                  `px-4 py-3 text-sm font-semibold border-b border-emerald-100 ${
                    isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                  }`
                }>
                Order Tray
              </NavLink>
              <NavLink to="/customer/orders" onClick={handleNavClick} className={({ isActive }) =>
                  `px-4 py-3 text-sm font-semibold border-b border-emerald-100 ${
                    isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                  }`
                }>
                Orders
              </NavLink>
              <NavLink to="/customer/my-reservations" onClick={handleNavClick} className={({ isActive }) =>
                  `px-4 py-3 text-sm font-semibold border-b border-emerald-100 ${
                    isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                  }`
                }>
                Reservations
              </NavLink>
              <NavLink to="/customer/reservation-form" onClick={handleNavClick} className={({ isActive }) =>
                  `px-4 py-3 text-sm font-semibold border-b border-emerald-100 ${
                    isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
                  }`
                }>
                Book Table
              </NavLink>
              <Link to="/menu" onClick={handleNavClick} className="px-4 py-3 text-sm font-semibold border-b border-emerald-100 text-slate-700 hover:bg-slate-50">
                Public Menu
              </Link>
            </nav>

            {/* Mobile Profile & Logout */}
            <div className="p-3 border-t border-emerald-100">
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
