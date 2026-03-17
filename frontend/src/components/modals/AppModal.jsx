import useBodyScrollLock from "../../hooks/useBodyScrollLock";
import useResolvedColorMode from "../../hooks/useResolvedColorMode";

const AppModal = ({ isOpen, title, onClose, children, maxWidth = "max-w-2xl" }) => {
  const { palette } = useResolvedColorMode({
    colorMode: "system",
    allowUserThemeToggle: true,
    surfaceColor: "#f8fafc",
  });

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/28">
      <div
        className={`w-full ${maxWidth} rounded-2xl shadow-2xl backdrop-blur-xl`}
        style={{ backgroundColor: palette.panelBg, color: palette.text, border: `1px solid ${palette.border}` }}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: palette.border }}>
          <h3 className="text-sm font-black" style={{ color: palette.text }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-2 py-1 text-xs font-semibold transition-colors"
            style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.cardBg }}
          >
            Close
          </button>
        </div>
        <div className="max-h-[80vh] overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
};

export default AppModal;
