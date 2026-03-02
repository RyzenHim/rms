import { Link } from "react-router-dom";

const AuthLayout = ({ children, title, subtitle, badge = "DelishDrop Access" }) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#fcd34d,transparent_35%),radial-gradient(circle_at_85%_20%,#34d399,transparent_35%),radial-gradient(circle_at_50%_95%,#60a5fa,transparent_40%),#0f172a] p-4 md:p-8">
      <div className="mx-auto grid min-h-[90vh] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 backdrop-blur md:grid-cols-2">
        <section className="relative hidden overflow-hidden p-10 text-white md:block">
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1300&q=80"
            alt="Restaurant ambience"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-slate-900/55 to-slate-950/85" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                {badge}
              </Link>
              <h1 className="mt-8 max-w-md text-5xl font-black leading-[1.08]">
                Restaurant Platform Built For Speed & Service
              </h1>
              <p className="mt-4 max-w-md text-white/85">
                Smooth operations for staff and seamless ordering for customers, all in one modern dashboard.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              {[
                ["Live Orders", "24+"],
                ["Daily Guests", "1.5K"],
                ["Service Rating", "4.9/5"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/25 bg-black/25 p-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-wider text-white/70">{label}</p>
                  <p className="mt-1 text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white/95 p-6 md:p-10">
          <div className="w-full max-w-md animate-fade-in-up rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_28px_65px_rgba(15,23,42,0.15)] md:p-8">
            <Link to="/" className="text-sm font-semibold text-emerald-700">
              ← Back to Home
            </Link>
            <h2 className="mt-3 text-4xl font-black text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthLayout;
