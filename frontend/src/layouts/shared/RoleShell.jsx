import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RoleShell = ({ title, links }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">{title}</p>
            <h1 className="text-2xl font-black text-slate-900">DelishDrop Control</h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.roles?.join(", ")}</p>
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
            <Link to="/" className="block rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Public Landing
            </Link>
            <button
              onClick={logout}
              className="mt-1 w-full rounded-xl bg-red-50 px-4 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Logout
            </button>
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
