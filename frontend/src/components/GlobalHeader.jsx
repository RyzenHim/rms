import ProfileHeader from "./ProfileHeader";
import { useAuth } from "../context/AuthContext";
import useResolvedColorMode from "../hooks/useResolvedColorMode";

const GlobalHeader = ({ title = "Restaurant Management" }) => {
  const { user } = useAuth();
  const { palette } = useResolvedColorMode({
    colorMode: "system",
    allowUserThemeToggle: true,
    surfaceColor: "#f8fafc",
  });

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur"
      style={{ borderColor: palette.border, backgroundColor: palette.panelBg, backdropFilter: palette.backdrop, boxShadow: palette.glassShadow }}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 md:px-8">
        <div className="flex-1">
          <p className="text-sm sm:text-base font-bold" style={{ color: palette.primary }}>{title}</p>
        </div>

        {user && <ProfileHeader />}
      </div>
    </header>
  );
};

export default GlobalHeader;
