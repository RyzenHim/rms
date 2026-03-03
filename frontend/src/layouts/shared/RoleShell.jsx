import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProfileHeader from "../../components/ProfileHeader";

const RoleShell = ({ title, links, basePath }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profileTo = `${basePath}/profile`;
  const avatar = user?.profileImage || "";
  const initials = String(user?.name || "U")
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const searchableLinks = useMemo(
    () => [...links, { to: profileTo, label: "Profile" }, { to: "/menu", label: "Public Landing" }],
    [links, profileTo],
  );

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const query = search.trim().toLowerCase();
    if (!query) return;

    const exact = searchableLinks.find((item) => item.label.toLowerCase() === query);
    const partial = searchableLinks.find((item) => item.label.toLowerCase().includes(query));
    const target = exact || partial;
    if (target) {
      navigate(target.to);
      setSearch("");
      setSidebarOpen(false);
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 md:px-8">
          <div className="hidden sm:block flex-shrink-0">
            <p className="text-xs uppercase tracking-widest text-slate-500">{title}</p>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 truncate">DelishDrop</h1>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition flex-shrink-0"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Search Bar */}
          <form onSubmit={onSearchSubmit} className="hidden sm:block flex-1 md:flex-none md:w-64 lg:w-80">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs sm:text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
            />
          </form>
          
          {/* Desktop Profile & User Info */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-shrink-0">
            <div className="text-right hidden lg:block">
              <p className="text-sm font-semibold text-slate-700 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.roles?.join(", ")}</p>
            </div>
            <ProfileHeader />
          </div>
        </div>

        {/* Mobile Search Bar */}
        <form onSubmit={onSearchSubmit} className="sm:hidden px-3 py-2 border-t border-slate-200">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
          />
        </form>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={closeSidebar} />
      )}

      <div className="mx-auto grid max-w-7xl gap-3 sm:gap-5 px-3 sm:px-4 py-3 sm:py-6 md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr] md:px-8">
        {/* Sidebar - Desktop visible, Mobile collapsible */}
        <aside className={`fixed left-0 top-0 h-screen bg-white rounded-none md:rounded-2xl md:relative md:h-auto shadow-lg md:shadow-sm z-30 md:z-auto transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 w-64"
        }`}>
          <div className="p-3 md:p-3 h-screen md:h-auto overflow-y-auto">
            <div className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isActive ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <Link to="/menu" onClick={closeSidebar} className="block rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
                Public Landing
              </Link>
            </div>

            {/* Mobile Profile Section */}
            <div className="md:hidden mt-6 pt-6 border-t border-slate-200">
              <ProfileHeader />
            </div>
          </div>
        </aside>
        <main className="rounded-2xl bg-white p-4 sm:p-5 md:p-7 shadow-sm">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RoleShell;
