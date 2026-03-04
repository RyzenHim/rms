import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronDown, FiLogOut, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const ProfileHeader = () => {
  const { user, logout, getPrimaryRole } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

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
        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition text-sm sm:text-base"
      >
        {profileImage && !imageLoadFailed ? (
          <img
            src={profileImage}
            alt={user.name || "User"}
            onError={() => setImageLoadFailed(true)}
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm">
            {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
          </div>
        )}
        <span className="hidden sm:inline font-medium text-gray-900">
          {user.name || user.email?.split("@")[0]}
        </span>
        <FiChevronDown className={`h-4 w-4 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
      </button>

      {profileOpen && (
        <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
            <p className="text-xs sm:text-sm text-gray-600">Logged in as</p>
            <p className="font-bold text-sm sm:text-base text-gray-900">
              {user.name || user.email?.split("@")[0]}
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

          <div className="py-2">
            <button
              onClick={handleViewProfile}
              className="inline-flex w-full items-center gap-2 px-4 py-2 text-left text-sm sm:text-base text-gray-700 hover:bg-gray-100 transition"
            >
              <FiUser className="h-4 w-4" />
              View Profile
            </button>
          </div>

          <div className="border-t border-gray-200 py-2">
            <button
              onClick={handleLogout}
              className="inline-flex w-full items-center gap-2 px-4 py-2 text-left text-sm sm:text-base text-red-600 hover:bg-red-50 font-semibold transition"
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
