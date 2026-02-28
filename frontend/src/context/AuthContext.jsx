import { createContext, useContext, useEffect, useMemo, useState } from "react";
import authService from "../services/auth_Service";

const AuthContext = createContext(null);

const STORAGE_TOKEN = "rms_token";
const STORAGE_USER = "rms_user";

const getPrimaryRole = (roles = []) => {
  const priority = ["admin", "manager", "kitchen", "cashier", "waiter", "customer"];
  return priority.find((role) => roles.includes(role)) || "customer";
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(STORAGE_USER);
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  const persist = (nextToken, nextUser) => {
    if (nextToken) {
      localStorage.setItem(STORAGE_TOKEN, nextToken);
    } else {
      localStorage.removeItem(STORAGE_TOKEN);
    }

    if (nextUser) {
      localStorage.setItem(STORAGE_USER, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(STORAGE_USER);
    }
  };

  const login = async (payload) => {
    setLoading(true);
    try {
      const data = await authService.login(payload);
      setToken(data.token);
      setUser(data.user);
      persist(data.token, data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (payload) => {
    setLoading(true);
    try {
      const data = await authService.signup(payload);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const refreshMe = async () => {
    if (!token) return null;
    try {
      const data = await authService.me(token);
      setUser(data.user);
      persist(token, data.user);
      return data.user;
    } catch {
      logout();
      return null;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    persist(null, null);
  };

  useEffect(() => {
    if (token && !user) {
      refreshMe();
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      signup,
      refreshMe,
      logout,
      getPrimaryRole,
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
