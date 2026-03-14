import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import themeService from "../../services/theme_Service";
import { useAuth } from "../../context/AuthContext";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";
import useOrderTray from "../../hooks/useOrderTray";
import AppNavbar from "../../components/navigation/AppNavbar";

const fallbackTheme = {
  name: "Feane Restaurant",
  logoText: "Feane",
  logoImage: "",
  primaryColor: "#ff8c3a",
  secondaryColor: "#ffd700",
  accentColor: "#292524",
  surfaceColor: "#fafaf9",
  colorMode: "system",
  allowUserThemeToggle: true,
};

const Visitor_Layout = () => {
  const { isAuthenticated, user, getPrimaryRole } = useAuth();
  const [theme, setTheme] = useState(fallbackTheme);
  const { cart, itemCount } = useOrderTray();
  const { palette, resolvedMode, setUserMode, allowUserThemeToggle } =
    useResolvedColorMode(theme);

  useEffect(() => {
    themeService
      .getActiveTheme()
      .then((res) => setTheme((prev) => ({ ...prev, ...res.theme })))
      .catch(() => {});
  }, []);

  const primaryRole = getPrimaryRole(user?.roles || []);
  const routeByRole = {
    admin: "/admin",
    manager: "/manager",
    kitchen: "/kitchen",
    cashier: "/cashier",
    waiter: "/waiter",
  };
  const dashboardPath = routeByRole[primaryRole] || "/dashboard";

  const isCustomer = isAuthenticated && user?.roles?.includes("customer");
  const roleLinks = isCustomer
    ? [
        { to: "/", label: "Home", end: true },
        { to: "/menu", label: "Menu" },
        { to: "/customer/orders", label: "Orders" },
        { to: "/customer/my-reservations", label: "Reservations" },
        { to: "/customer/profile", label: "Profile" },
      ]
    : [
        { to: "/", label: "Home", end: true },
        { to: "/menu", label: "Menu" },
        ...(isAuthenticated && !user?.roles?.includes("customer")
          ? [{ to: dashboardPath, label: "Dashboard" }]
          : []),
      ];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: palette.pageBg, color: palette.text }}
    >
      <AppNavbar
        brandName={theme.logoText || "DelishDrop"}
        brandSub={theme.name || ""}
        logoImage={theme.logoImage || ""}
        links={roleLinks}
        palette={palette}
        resolvedMode={resolvedMode}
        setUserMode={setUserMode}
        allowUserThemeToggle={allowUserThemeToggle}
        showGuestAuth
        trayItems={isCustomer ? cart : []}
        trayItemCount={isCustomer ? itemCount : 0}
      />
      <Outlet />
    </div>
  );
};

export default Visitor_Layout;
