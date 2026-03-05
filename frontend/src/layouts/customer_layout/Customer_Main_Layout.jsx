import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import themeService from "../../services/theme_Service";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";
import AppNavbar from "../../components/navigation/AppNavbar";

const Customer_Main_Layout = () => {
  const [theme, setTheme] = useState({
    name: "DelishDrop",
    logoText: "DelishDrop",
    logoImage: "",
    colorMode: "system",
    allowUserThemeToggle: true,
    surfaceColor: "#f1f5f9",
  });
  const { resolvedMode, setUserMode, palette, allowUserThemeToggle } = useResolvedColorMode(theme);

  useEffect(() => {
    themeService
      .getActiveTheme()
      .then((data) => {
        if (data?.theme) setTheme((prev) => ({ ...prev, ...data.theme }));
      })
      .catch(() => {});
  }, []);

  const links = [
    { to: "/", label: "Home", end: true },
    { to: "/menu", label: "Menu" },
    { to: "/customer/menu", label: "Order Tray" },
    { to: "/customer/orders", label: "Orders" },
    { to: "/customer/my-reservations", label: "Reservations" },
    { to: "/customer/reservation-form", label: "Book Table" },
    { to: "/customer/profile", label: "Profile" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: palette.pageBg, color: palette.text }}>
      <AppNavbar
        brandName={theme.logoText || "DelishDrop"}
        brandSub={theme.name || ""}
        logoImage={theme.logoImage || ""}
        links={links}
        palette={palette}
        resolvedMode={resolvedMode}
        setUserMode={setUserMode}
        allowUserThemeToggle={allowUserThemeToggle}
        showGuestAuth={false}
      />
      <Outlet />
    </div>
  );
};

export default Customer_Main_Layout;
