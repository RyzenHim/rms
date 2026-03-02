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
      title="Create Customer Account"
      subtitle="Customer signup only. Staff accounts are created by admin."
      badge="Customer Signup"
    >
      <form onSubmit={handleSubmit}>
        <AuthInput
          label="Full Name"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter your full name"
        />
        <AuthInput
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
        />
        <AuthInput
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Create a secure password"
        />
        <AuthInput
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
        />
        <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          Note: Admin, manager, waiter, cashier and kitchen roles cannot register from this page.
        </p>
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-semibold text-emerald-700">
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Signup;
