const AppModal = ({ isOpen, title, onClose, children, maxWidth = "max-w-2xl" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full ${maxWidth} rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
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
