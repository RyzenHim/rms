import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/auth_layout/AuthLayout";
import AuthInput from "../../components/auth_Components/AuthInput";
import { useAuth } from "../../context/AuthContext";

const Signup = () => {
  const { signup, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await signup({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      navigate("/auth/login", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to signup");
    }
  };

  return (
    <AuthLayout
      title="Join as Customer"
      subtitle="Create your account to start ordering. Staff accounts are managed by admin."
      badge="Customer Registration"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthInput
          label="Full Name"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="John Doe"
        />
        <AuthInput
          label="Email Address"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="john@example.com"
        />
        <AuthInput
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
        />
        <AuthInput
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
        />

        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 px-5 py-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Note</p>
              <p className="text-sm text-blue-800 mt-1">
                Staff accounts (Admin, Manager, Waiter, Cashier, Kitchen) are created by restaurant management only.
              </p>
            </div>
          </div>
        </div>

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
              Creating account...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Create Account</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          )}
        </button>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
            Sign in here
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Signup;
