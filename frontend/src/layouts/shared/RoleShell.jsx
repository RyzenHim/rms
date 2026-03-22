import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import themeService from "../../services/theme_Service";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";
import EmployeeSidebar from "../../components/navigation/EmployeeSidebar";

const RoleShell = ({ links = [] }) => {
  const [theme, setTheme] = useState({
    name: "DelishDrop",
    logoText: "DelishDrop",
    logoImage: "",
    colorMode: "system",
    allowUserThemeToggle: true,
    surfaceColor: "#f1f5f9",
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedMode, setUserMode, palette, allowUserThemeToggle } = useResolvedColorMode(theme);

  useEffect(() => {
    themeService
      .getActiveTheme()
      .then((data) => {
        if (data?.theme) setTheme((prev) => ({ ...prev, ...data.theme }));
      })
      .catch(() => { });
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col md:flex-row"
      style={{ backgroundColor: palette.pageBg, color: palette.text }}
    >
      {/* Sidebar */}
      <EmployeeSidebar
        brandName={theme.logoText || "DelishDrop"}
        brandSub={theme.name || ""}
        logoImage={theme.logoImage || ""}
        links={links}
        palette={palette}
        resolvedMode={resolvedMode}
        setUserMode={setUserMode}
        allowUserThemeToggle={allowUserThemeToggle}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="min-h-[calc(100vh-6.7rem)] overflow-y-auto md:h-screen" style={{ backgroundColor: palette.pageBg }}>
          <div className="mx-auto w-full max-w-[112rem] px-3 py-4 sm:px-4 lg:px-6">
            <div
              className="rounded-[1.5rem] border p-3 shadow-md transition-all duration-300 sm:p-4 md:p-5"
              style={{
                backgroundColor: palette.panelBg,
                borderColor: palette.border,
                color: palette.text,
                boxShadow: palette.glassShadow,
                backdropFilter: palette.backdrop,
              }}
            >
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleShell;
