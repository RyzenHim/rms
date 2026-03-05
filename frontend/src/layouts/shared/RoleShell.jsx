import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import themeService from "../../services/theme_Service";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";
import AppNavbar from "../../components/navigation/AppNavbar";

const RoleShell = ({ links = [] }) => {
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
      <main className="mx-auto w-full max-w-[96rem] px-4 py-6 md:px-8">
        <div className="rounded-2xl p-4 shadow-sm sm:p-5 md:p-7" style={{ backgroundColor: palette.panelBg, color: palette.text }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default RoleShell;
