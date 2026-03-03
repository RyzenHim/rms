import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProfileHeader = () => {
  const { user, logout, getPrimaryRole } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

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
      {/* Profile Button */}
      <button
        onClick={() => setProfileOpen(!profileOpen)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition text-sm sm:text-base"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm">
          {user.firstName?.charAt(0) || user.email?.charAt(0) || "U"}
        </div>
        {/* Name - visible on larger screens */}
        <span className="hidden sm:inline font-medium text-gray-900">
          {user.firstName || user.email?.split("@")[0]}
        </span>
        {/* Chevron */}
        <svg
          className={`w-4 h-4 transition-transform ${profileOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Profile Dropdown */}
      {profileOpen && (
        <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-50">
          {/* User Info */}
          <div className="px-4 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
            <p className="text-xs sm:text-sm text-gray-600">Logged in as</p>
            <p className="font-bold text-sm sm:text-base text-gray-900">
              {user.firstName || user.email?.split("@")[0]}
            </p>
            <p className="text-xs text-gray-500 mt-1">{user.email}</p>
            {user.roles && user.roles.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded capitalize"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={handleViewProfile}
              className="w-full text-left px-4 py-2 text-sm sm:text-base text-gray-700 hover:bg-gray-100 transition"
            >
              👤 View Profile
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 py-2">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm sm:text-base text-red-600 hover:bg-red-50 font-semibold transition"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;
