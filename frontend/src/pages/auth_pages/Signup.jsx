import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/auth_layout/AuthLayout";
import AuthInput from "../../components/auth_Components/AuthInput";
import { useAuth } from "../../context/AuthContext";

const roleOptions = [
  { label: "Customer", value: "customer" },
  { label: "Waiter", value: "waiter" },
  { label: "Cashier", value: "cashier" },
  { label: "Kitchen Staff", value: "kitchen" },
  { label: "Manager", value: "manager" },
  { label: "Admin", value: "admin" },
];

const Signup = () => {
  const { signup, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
        role: form.role,
      });
      navigate("/auth/login", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to signup");
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join DelishDrop in less than a minute">
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
        <div className="mb-4">
          <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-700">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
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
