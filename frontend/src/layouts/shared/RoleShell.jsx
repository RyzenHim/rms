import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProfileHeader from "../../components/ProfileHeader";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";
import { FiHome, FiMoon, FiSun } from "react-icons/fi";

const RoleShell = ({ title, links, basePath }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { resolvedMode, setUserMode, palette } = useResolvedColorMode({
    colorMode: "system",
    allowUserThemeToggle: true,
    surfaceColor: "#f1f5f9",
  });
  const profileTo = `${basePath}/profile`;
  const searchableLinks = useMemo(
    () => [...links, { to: profileTo, label: "Profile" }, { to: "/", label: "Public Landing" }],
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
    <div className="min-h-screen" style={{ backgroundColor: palette.pageBg, color: palette.text }}>
      <header className="sticky top-0 z-40 border-b" style={{ borderColor: palette.border, backgroundColor: `${palette.panelBg}E6` }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 md:px-8">
          <div className="hidden sm:block flex-shrink-0">
            <p className="text-xs uppercase tracking-widest" style={{ color: palette.muted }}>{title}</p>
            <h1 className="text-lg sm:text-2xl font-black truncate" style={{ color: palette.text }}>DelishDrop</h1>
          </div>

          {/* Mobile Menu Button */}
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
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 transition flex-shrink-0"
              style={{ color: palette.text }}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={onSearchSubmit} className="hidden sm:block flex-1 md:flex-none md:w-64 lg:w-80">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-full border px-3 py-2 text-xs sm:text-sm outline-none transition"
              style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
            />
          </form>
          
          {/* Desktop Profile & User Info */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-shrink-0">
            <button
              onClick={() => setUserMode(resolvedMode === "dark" ? "light" : "dark")}
              className="rounded-full border p-2 transition"
              style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
              title={resolvedMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {resolvedMode === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
            </button>
            <div className="text-right hidden lg:block">
              <p className="text-sm font-semibold text-slate-700 truncate">{user?.name}</p>
              <p className="text-xs truncate" style={{ color: palette.muted }}>{user?.roles?.join(", ")}</p>
            </div>
            <ProfileHeader />
          </div>
        </div>

        {/* Mobile Search Bar */}
        <form onSubmit={onSearchSubmit} className="sm:hidden border-t px-3 py-2" style={{ borderColor: palette.border }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-full border px-3 py-2 text-sm outline-none transition"
            style={{ borderColor: palette.border, backgroundColor: palette.cardBg, color: palette.text }}
          />
        </form>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={closeSidebar} />
      )}

      <div className="mx-auto grid max-w-7xl gap-3 px-3 py-3 sm:gap-5 sm:px-4 sm:py-6 md:grid-cols-[200px_1fr] md:px-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar - Desktop visible, Mobile collapsible */}
        <aside className={`fixed left-0 top-0 h-screen rounded-none md:relative md:h-auto md:rounded-2xl z-30 md:z-auto transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 w-64"
        }`} style={{ backgroundColor: palette.panelBg }}>
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
                    isActive ? "bg-emerald-700 text-white" : "hover:bg-slate-100"
                  }`
                }
                style={({ isActive }) => (isActive ? undefined : { color: palette.text })}
              >
                {link.label}
              </NavLink>
            ))}
            </div>
            <div className="mt-4 border-t pt-4" style={{ borderColor: palette.border }}>
              <Link to="/" onClick={closeSidebar} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-100 transition" style={{ color: palette.text }}>
                <FiHome className="h-4 w-4" />
                Public Landing
              </Link>
            </div>

            {/* Mobile Profile Section */}
            <div className="md:hidden mt-6 border-t pt-6" style={{ borderColor: palette.border }}>
              <ProfileHeader />
            </div>
          </div>
        </aside>
        <main className="rounded-2xl p-4 shadow-sm sm:p-5 md:p-7" style={{ backgroundColor: palette.panelBg, color: palette.text }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RoleShell;
