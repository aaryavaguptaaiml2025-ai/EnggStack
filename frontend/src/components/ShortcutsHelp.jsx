import { motion, AnimatePresence } from "framer-motion";
import { SHORTCUTS } from "../hooks/useKeyboardShortcuts";

export default function ShortcutsHelp({ open, onClose }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99998] flex items-center justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #151d2e 0%, #0f172a 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          }}
        >
          <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00C896] text-lg">keyboard</span>
              <span className="text-sm font-bold text-[var(--text)]">Keyboard Shortcuts</span>
            </div>
            <button onClick={onClose} className="text-muted hover:text-[var(--text)] transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div className="p-4 space-y-1">
            {SHORTCUTS.map((s, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5 transition-colors">
                <span className="text-sm text-[var(--text)]">{s.label}</span>
                <div className="flex items-center gap-1">
                  {s.key.split("+").map((k, j) => (
                    <span key={j}>
                      {j > 0 && <span className="text-dim text-xs mx-0.5">+</span>}
                      <kbd className="px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-xs font-mono text-muted min-w-[28px] text-center inline-block">
                        {k.replace("Ctrl", "⌘")}
                      </kbd>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-3 border-t border-white/10 text-center text-[10px] text-dim">
            Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded font-mono">?</kbd> to toggle this panel
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
