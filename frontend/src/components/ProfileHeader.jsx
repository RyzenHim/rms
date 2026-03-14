import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronDown, FiLogOut, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import useResolvedColorMode from "../hooks/useResolvedColorMode";

const ProfileHeader = () => {
  const { user, logout, getPrimaryRole } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const { palette } = useResolvedColorMode({
    colorMode: "system",
    allowUserThemeToggle: true,
    surfaceColor: "#f8fafc",
  });

  const profileImage = useMemo(() => String(user?.profileImage || "").trim(), [user?.profileImage]);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [profileImage]);

  if (!user) return null;

  const primaryRole = getPrimaryRole(user.roles);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/auth/login");
  };

  const handleViewProfile = () => {
    const profilePath = `/${primaryRole}/profile`;
    navigate(profilePath);
    setProfileOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setProfileOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition sm:px-4 sm:text-base"
        style={{ backgroundColor: palette.cardBg, borderColor: palette.border, color: palette.text }}
      >
        {profileImage && !imageLoadFailed ? (
          <img
            src={profileImage}
            alt={user.name || "User"}
            onError={() => setImageLoadFailed(true)}
            className="h-8 w-8 rounded-full border object-cover"
            style={{ borderColor: palette.border }}
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600 text-xs font-bold text-white sm:text-sm">
            {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
          </div>
        )}
        <span className="hidden font-medium sm:inline" style={{ color: palette.text }}>
          {user.name || user.email?.split("@")[0]}
        </span>
        <FiChevronDown className={`h-4 w-4 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
      </button>

      {profileOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border shadow-lg sm:w-56"
          style={{ backgroundColor: palette.panelBg, borderColor: palette.border }}
        >
          <div className="border-b px-4 py-3 sm:py-4" style={{ borderColor: palette.border, backgroundColor: palette.cardBg }}>
            <p className="text-xs sm:text-sm" style={{ color: palette.muted }}>Logged in as</p>
            <p className="text-sm font-bold sm:text-base" style={{ color: palette.text }}>
              {user.name || user.email?.split("@")[0]}
            </p>
            <p className="mt-1 text-xs" style={{ color: palette.muted }}>{user.email}</p>
            {user.roles && user.roles.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-block px-2 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded capitalize"
                    style={{ backgroundColor: palette.pageBg, color: palette.text }}
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="py-2">
            <button
              onClick={handleViewProfile}
              className="inline-flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition sm:text-base"
              style={{ color: palette.text }}
            >
              <FiUser className="h-4 w-4" />
              View Profile
            </button>
          </div>

          <div className="border-t py-2" style={{ borderColor: palette.border }}>
            <button
              onClick={handleLogout}
              className="inline-flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-semibold transition sm:text-base text-red-600"
            >
              <FiLogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;
