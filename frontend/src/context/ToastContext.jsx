import { createContext, useContext, useState, useCallback, useMemo } from "react";

const ToastCtx = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = "success", duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev.slice(-2), { id, msg, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useMemo(() => ({
    success: (msg) => addToast(msg, "success"),
    error:   (msg) => addToast(msg, "error"),
    info:    (msg) => addToast(msg, "info"),
    warning: (msg) => addToast(msg, "warning"),
  }), [addToast]);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: 360 }}>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

const TOAST_STYLES = {
  success: { color: "#00C896", icon: "check_circle",  border: "rgba(0,200,150,0.3)" },
  error:   { color: "#f87171", icon: "error",          border: "rgba(248,113,113,0.3)" },
  info:    { color: "#60a5fa", icon: "info",           border: "rgba(96,165,250,0.3)" },
  warning: { color: "#fbbf24", icon: "warning",        border: "rgba(251,191,36,0.3)" },
};

function ToastItem({ toast, onClose }) {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.success;

  return (
    <div
      className="pointer-events-auto slide-in bg-[#0B132B]/95 backdrop-blur-xl
        border rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3"
      style={{ borderColor: style.border }}
    >
      <span className="material-symbols-outlined text-lg flex-shrink-0"
        style={{ color: style.color }}>{style.icon}</span>
      <span className="flex-1 text-sm text-on-surface">{toast.msg}</span>
      <button onClick={onClose}
        className="text-dim hover:text-on-surface transition-colors duration-200 flex-shrink-0">
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  );
}

export const useToast = () => useContext(ToastCtx);
