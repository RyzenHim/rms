import { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import menuService from "../../services/menu_Service";
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
  const cachedTheme = themeService.getCachedActiveTheme?.();
  const cachedMenu = menuService.getCachedPublicMenu?.();
  const [theme, setTheme] = useState(() =>
    cachedTheme?.theme ? { ...fallbackTheme, ...cachedTheme.theme } : fallbackTheme
  );
  const [menuData, setMenuData] = useState(() => ({
    categories: cachedMenu?.categories || [],
    subCategories: cachedMenu?.subCategories || [],
    items: cachedMenu?.items || [],
    menuPdf: cachedMenu?.menuPdf || null,
  }));
  const { cart, itemCount } = useOrderTray();
  const { palette, resolvedMode, setUserMode, allowUserThemeToggle } = useResolvedColorMode(theme);

  useEffect(() => {
    Promise.all([themeService.getActiveTheme(), menuService.getPublicMenu()])
      .then(([themeResponse, menuResponse]) => {
        setTheme((prev) => ({ ...prev, ...themeResponse.theme }));
        setMenuData({
          categories: menuResponse.categories || [],
          subCategories: menuResponse.subCategories || [],
          items: menuResponse.items || [],
          menuPdf: menuResponse.menuPdf || null,
        });
      })
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

  const visitorContext = useMemo(
    () => ({
      theme,
      menuData,
    }),
    [theme, menuData]
  );

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: palette.pageBg, color: palette.text }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute -left-48 -top-48 h-[42rem] w-[42rem] rounded-full opacity-25 blur-[120px]"
          style={{ background: `radial-gradient(circle, ${theme.secondaryColor}, transparent 70%)` }}
        />
        <div
          className="absolute -right-40 -top-32 h-[38rem] w-[38rem] rounded-full opacity-20 blur-[100px]"
          style={{ background: `radial-gradient(circle, ${theme.primaryColor}, transparent 70%)` }}
        />
        <div
          className="absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full opacity-10 blur-[140px]"
          style={{ background: `radial-gradient(circle, ${theme.accentColor}, transparent 65%)` }}
        />
      </div>

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

      <Outlet context={visitorContext} />
    </div>
  );
};

export default Visitor_Layout;
