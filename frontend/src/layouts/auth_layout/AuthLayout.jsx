import { Link } from "react-router-dom";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-[linear-gradient(140deg,#e8f8ef_0%,#f7f7f2_45%,#eef6ff_100%)] p-4 md:p-8">
      <div className="mx-auto grid min-h-[88vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.12)] md:grid-cols-2">
        <section className="relative hidden bg-[radial-gradient(circle_at_20%_30%,#34d399,transparent_40%),radial-gradient(circle_at_80%_20%,#fde68a,transparent_35%),#064e3b] p-12 text-white md:flex md:flex-col md:justify-between">
          <div>
            <Link to="/" className="text-2xl font-black tracking-tight">
              DelishDrop
            </Link>
            <h1 className="mt-8 max-w-md text-5xl font-black leading-tight">
              Crafted dishes. Smart operations.
            </h1>
            <p className="mt-5 max-w-md text-emerald-100">
              Login to manage orders, kitchen workflow, and customer delight from one
              platform.
            </p>
          </div>
          <p className="text-sm text-emerald-100">
            Restaurant Management System for admins, staff, and customers.
          </p>
        </section>

        <section className="flex items-center justify-center bg-white p-6 md:p-10">
          <div className="w-full max-w-md rounded-2xl bg-white p-2">
            <h2 className="text-3xl font-black text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthLayout;
