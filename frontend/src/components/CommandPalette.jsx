import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ACTIONS = [
  // Navigate
  { id: "nav-dashboard",   label: "Go to Dashboard",    icon: "dashboard",      type: "navigate", to: "/dashboard",    keywords: "home main" },
  { id: "nav-notes",       label: "Go to Notes",        icon: "edit_note",      type: "navigate", to: "/notes",        keywords: "write note" },
  { id: "nav-pomodoro",    label: "Go to Pomodoro",     icon: "timer",          type: "navigate", to: "/pomodoro",     keywords: "focus timer study" },
  { id: "nav-analytics",   label: "Go to Analytics",    icon: "analytics",      type: "navigate", to: "/analytics",    keywords: "stats charts data" },
  { id: "nav-calendar",    label: "Go to Calendar",     icon: "calendar_month", type: "navigate", to: "/calendar",     keywords: "schedule date" },
  { id: "nav-flashcards",  label: "Go to Flashcards",   icon: "style",          type: "navigate", to: "/flashcards",   keywords: "cards review study srs" },
  { id: "nav-ai",          label: "Go to AI Chat",      icon: "psychology",     type: "navigate", to: "/ai-chat",      keywords: "ask question gpt ai" },
  { id: "nav-deadlines",   label: "Go to Deadlines",    icon: "event",          type: "navigate", to: "/deadlines",    keywords: "due tasks" },
  { id: "nav-checklist",   label: "Go to Checklist",    icon: "checklist",      type: "navigate", to: "/checklist",    keywords: "tasks todo" },
  { id: "nav-subjects",    label: "Go to Subjects",     icon: "menu_book",      type: "navigate", to: "/subjects",     keywords: "courses" },
  { id: "nav-timetable",   label: "Go to Timetable",    icon: "calendar_today", type: "navigate", to: "/timetable",    keywords: "schedule class" },
  { id: "nav-music",       label: "Go to Music",        icon: "music_note",     type: "navigate", to: "/music",        keywords: "ambient sound" },
  { id: "nav-friends",     label: "Go to Friends",      icon: "group",          type: "navigate", to: "/friends",      keywords: "social" },
  { id: "nav-settings",    label: "Go to Settings",     icon: "settings",       type: "navigate", to: "/settings",     keywords: "preferences config" },
  // Create
  { id: "create-note",     label: "New Note",           icon: "note_add",       type: "create",   to: "/notes",        keywords: "create add" },
  { id: "create-deadline", label: "New Deadline",       icon: "event",          type: "create",   to: "/deadlines",    keywords: "create add due" },
  { id: "create-deck",     label: "New Flashcard Deck", icon: "library_add",    type: "create",   to: "/flashcards",   keywords: "create add cards" },
  // Actions
  { id: "start-pomodoro",  label: "Start Pomodoro",     icon: "play_circle",    type: "action",   to: "/pomodoro",     keywords: "begin focus timer" },
  { id: "export-data",     label: "Export my data",     icon: "download",       type: "action",   to: "/settings",     keywords: "download backup json" },
  { id: "shortcuts",       label: "Keyboard shortcuts", icon: "keyboard",       type: "action",   action: "shortcuts", keywords: "help hotkeys keys" },
];

const TYPE_LABELS = { navigate: "Navigate", create: "Create", action: "Action" };
const TYPE_COLORS = { navigate: "#3b82f6", create: "#00C896", action: "#f97316" };

function fuzzyMatch(query, text) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  // Fuzzy: every char in query appears in order
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export default function CommandPalette({ onShortcuts }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  // Open on Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Filter results
  const results = query.trim()
    ? ACTIONS.filter(a => fuzzyMatch(query, a.label + " " + a.keywords))
    : ACTIONS;

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      e.preventDefault();
      executeAction(results[selectedIdx]);
    }
  }, [results, selectedIdx]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIdx];
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  const executeAction = (action) => {
    setOpen(false);
    if (action.action === "shortcuts" && onShortcuts) {
      onShortcuts();
      return;
    }
    if (action.to) navigate(action.to);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh]"
        onClick={() => setOpen(false)}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        {/* Palette */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #151d2e 0%, #0f172a 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,200,150,0.05)",
          }}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            <span className="material-symbols-outlined text-muted text-xl">search</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Type a command..."
              className="flex-1 bg-transparent text-[var(--text)] text-sm outline-none placeholder:text-white/20"
            />
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-muted font-mono">ESC</kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[340px] overflow-y-auto py-2 px-2">
            {results.length === 0 ? (
              <div className="text-center py-8 text-muted text-sm">No results found</div>
            ) : (
              results.map((action, idx) => (
                <button
                  key={action.id}
                  onClick={() => executeAction(action)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-100
                    ${idx === selectedIdx ? "bg-white/[.08]" : "hover:bg-white/[.04]"}`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${TYPE_COLORS[action.type]}10` }}>
                    <span className="material-symbols-outlined text-lg"
                      style={{ color: TYPE_COLORS[action.type] }}>
                      {action.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--text)] font-medium truncate">{action.label}</div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                    style={{ color: TYPE_COLORS[action.type], background: `${TYPE_COLORS[action.type]}10` }}>
                    {TYPE_LABELS[action.type]}
                  </span>
                  {idx === selectedIdx && (
                    <span className="text-[10px] text-dim">↵</span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 px-5 py-2.5 flex justify-between text-[10px] text-dim">
            <div className="flex gap-3">
              <span><kbd className="bg-white/10 px-1 py-0.5 rounded font-mono mr-0.5">↑↓</kbd> Navigate</span>
              <span><kbd className="bg-white/10 px-1 py-0.5 rounded font-mono mr-0.5">↵</kbd> Select</span>
            </div>
            <span><kbd className="bg-white/10 px-1 py-0.5 rounded font-mono mr-0.5">⌘K</kbd> Toggle</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
