import { Link } from "react-router-dom";

const AuthLayout = ({ children, title, subtitle, badge = "DelishDrop Access" }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-900 p-4 md:p-8 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="mx-auto grid h-[calc(100vh-2rem)] max-h-[920px] w-full max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl md:h-[calc(100vh-4rem)] md:grid-cols-2">
        {/* Left Side - Hero Section */}
        <section className="relative hidden overflow-hidden p-12 text-white md:flex md:flex-col md:justify-between">
          <img
            src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1300&q=80"
            alt="Restaurant ambience"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-slate-950/60 to-slate-950/90" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-4 py-2 text-sm font-semibold backdrop-blur-md">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              {badge}
            </div>

            <div>
              <h1 className="text-5xl md:text-6xl font-black leading-tight">
                Restaurant Management
                <span className="block text-emerald-400">Made Simple</span>
              </h1>
              <p className="mt-4 text-lg text-white/80 max-w-md leading-relaxed">
                Streamlined operations for staff, seamless ordering for customers. One powerful platform.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="relative z-10 grid grid-cols-3 gap-4">
            {[
              { label: "Active Orders", value: "245+" },
              { label: "Daily Customers", value: "1.8K" },
              { label: "Satisfaction", value: "4.9/5" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-4 hover:bg-white/15 transition-colors duration-300">
                <p className="text-xs uppercase tracking-wider text-white/70 font-semibold">{label}</p>
                <p className="mt-2 text-2xl font-black text-emerald-400">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Right Side - Form Section */}
        <section className="flex flex-col items-center justify-center overflow-y-auto bg-gradient-to-br from-white via-emerald-50/30 to-white p-5 md:p-9">
          <div className="w-full max-w-sm">
            {/* Back Button */}
            <Link 
              to="/" 
              className="group inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
            >
              <svg className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>

            {/* Form Container */}
            <div className="mt-6 space-y-3">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">{title}</h2>
                <p className="mt-3 text-base text-slate-600 font-medium">{subtitle}</p>
              </div>

              <div className="h-1.5 w-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
            </div>

            {/* Children - Form Content */}
            <div className="mt-7">
              {children}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthLayout;
