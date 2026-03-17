import { useAuth } from "../context/AuthContext";
import useBodyScrollLock from "../hooks/useBodyScrollLock";
import useResolvedColorMode from "../hooks/useResolvedColorMode";

const SessionExpiredModal = () => {
  const { sessionExpired, clearSessionExpired } = useAuth();
  const { palette } = useResolvedColorMode({
    colorMode: "system",
    allowUserThemeToggle: true,
    surfaceColor: "#f8fafc",
  });
  useBodyScrollLock(sessionExpired);

  const handleOK = () => {
    clearSessionExpired();
    // Use window.location for navigation outside of Router context
    window.location.href = "/auth/login";
  };

  if (!sessionExpired) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/28">
      <div
        className="max-w-sm w-full rounded-lg p-6 shadow-xl backdrop-blur-xl"
        style={{ backgroundColor: palette.panelBg, color: palette.text, border: `1px solid ${palette.border}` }}
      >
        <h2 className="mb-2 text-xl font-bold sm:text-2xl" style={{ color: palette.text }}>
          Session Expired
        </h2>
        <p className="mb-6 text-sm sm:text-base" style={{ color: palette.muted }}>
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

