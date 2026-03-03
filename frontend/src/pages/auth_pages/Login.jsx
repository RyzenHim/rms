import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/auth_layout/AuthLayout";
import AuthInput from "../../components/auth_Components/AuthInput";
import { useAuth } from "../../context/AuthContext";

const roleRouteMap = {
  admin: "/admin",
  manager: "/manager",
  kitchen: "/kitchen",
  cashier: "/cashier",
  waiter: "/waiter",
  customer: "/customer",
};

const Login = () => {
  const { login, loading, getPrimaryRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(form);
      const role = getPrimaryRole(user.roles);
      const fromPath = location.state?.from?.pathname || "";
      const fromSearch = location.state?.from?.search || "";
      const redirectTarget = fromPath ? `${fromPath}${fromSearch}` : roleRouteMap[role] || "/customer";
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to login");
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Enter your credentials to access your dashboard" badge="Secure Login">
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthInput
          label="Email Address"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="your.email@restaurant.com"
        />
        <AuthInput
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
        />

        {error && (
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-semibold text-red-800">{error}</p>
            </div>
          </div>
        )}

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-3.5 font-bold text-white shadow-lg shadow-emerald-600/30 transition duration-200 hover:shadow-xl hover:shadow-emerald-600/40 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Logging in...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Sign In</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          )}
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gradient-to-br from-white via-emerald-50/30 to-white px-3 text-slate-600 font-medium">Or continue with</span>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/50 px-5 py-4 space-y-2">
          <p className="text-xs uppercase tracking-wider text-slate-600 font-semibold">Sign-In Info</p>
          <p className="text-sm text-slate-700">Use your restaurant account email and password.</p>
        </div>

        <p className="text-center text-sm text-slate-600">
          Don&apos;t have a customer account?{" "}
          <Link to="/auth/signup" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
            Create one now
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;

