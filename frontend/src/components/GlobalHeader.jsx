import ProfileHeader from "./ProfileHeader";
import { useAuth } from "../context/AuthContext";

const GlobalHeader = ({ title = "Restaurant Management" }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 md:px-8">
        <div className="flex-1">
          <p className="text-sm sm:text-base font-bold text-orange-600">{title}</p>
        </div>

        {user && <ProfileHeader />}
      </div>
    </header>
  );
};

export default GlobalHeader;
