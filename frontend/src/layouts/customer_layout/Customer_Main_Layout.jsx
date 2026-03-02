import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Customer_Main_Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
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
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <p className="font-black text-emerald-800">Customer Experience</p>
            <nav className="hidden items-center gap-1 md:flex">
              <NavLink
                to="/customer"
                end
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm font-semibold ${
                    isActive ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/customer/menu"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm font-semibold ${
                    isActive ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                Order Tray
              </NavLink>
              <NavLink
                to="/customer/orders"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm font-semibold ${
                    isActive ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                Orders
              </NavLink>
              <Link to="/menu" className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Public
              </Link>
            </nav>
          </div>
          <form onSubmit={onSearchSubmit} className="order-3 w-full md:order-none md:w-[22rem]">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item/page..."
              className="w-full rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
            />
          </form>
          <div className="flex items-center gap-3">
            <Link to="/customer/profile" className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 hover:bg-slate-100">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user?.name || "profile"} className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                  {initials}
                </span>
              )}
              <span className="hidden text-sm font-semibold text-slate-700 sm:block">Profile</span>
            </Link>
            <button
              onClick={logout}
              className="rounded-full bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
};

export default Customer_Main_Layout;
