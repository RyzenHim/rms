import { useAuth } from "../context/AuthContext";

const SessionExpiredModal = () => {
  const { sessionExpired, clearSessionExpired } = useAuth();

  const handleOK = () => {
    clearSessionExpired();
    // Use window.location for navigation outside of Router context
    window.location.href = "/auth/login";
  };

  if (!sessionExpired) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full animate-pulse">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Session Expired
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          Your login session has expired. Please log in again to continue.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleOK}
            className="flex-1 px-4 py-2 sm:py-3 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
