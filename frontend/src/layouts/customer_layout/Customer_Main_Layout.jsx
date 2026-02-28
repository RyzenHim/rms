import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Customer_Main_Layout = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <p className="font-black text-emerald-800">Customer Experience</p>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-600">{user?.name}</p>
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
