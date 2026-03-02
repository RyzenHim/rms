import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RoleShell = ({ title, links, basePath }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
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
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">{title}</p>
            <h1 className="text-2xl font-black text-slate-900">DelishDrop Control</h1>
          </div>
          <form onSubmit={onSearchSubmit} className="w-full md:w-[22rem]">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item/page..."
              className="w-full rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
            />
          </form>
          <div className="flex items-center gap-3">
            <Link to={profileTo} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 transition hover:bg-slate-100">
              {avatar ? (
                <img src={avatar} alt={user?.name || "profile"} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                  {initials}
                </span>
              )}
              <span className="text-sm font-semibold text-slate-700">Profile</span>
            </Link>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.roles?.join(", ")}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 md:grid-cols-[240px_1fr] md:px-8">
        <aside className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-2 text-sm font-semibold ${
                    isActive ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <Link to="/menu" className="block rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Public Landing
            </Link>
          </div>
        </aside>
        <main className="rounded-2xl bg-white p-5 shadow-sm md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RoleShell;
