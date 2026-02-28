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
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(form);
      const role = getPrimaryRole(user.roles);
      const redirectTarget = location.state?.from?.pathname || roleRouteMap[role] || "/customer";
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to login");
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Login with your account to continue">
      <form onSubmit={handleSubmit}>
        <AuthInput
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="chef@delishdrop.com"
        />
        <AuthInput
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Enter your password"
        />
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link to="/auth/signup" className="font-semibold text-emerald-700">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
