import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

const SHORTCUTS = [
  { key: "Ctrl+K", label: "Open command palette", global: true },
  { key: "?", label: "Show keyboard shortcuts", global: true },
  { key: "Escape", label: "Close any open modal", global: true },
  { key: "Space", label: "Start/pause Pomodoro", page: "/pomodoro" },
  { key: "Ctrl+N", label: "New note", page: "/notes" },
];

export function useKeyboardShortcuts({ onCommandPalette, onShortcutsHelp, onPomodoroToggle, onNewNote, onCloseModal }) {
  const location = useLocation();

  const handler = useCallback((e) => {
    const tag = e.target.tagName;
    const isTyping = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable;

    // Ctrl+K → Command palette (always)
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      onCommandPalette?.();
      return;
    }

    // Escape → Close modal (always)
    if (e.key === "Escape") {
      onCloseModal?.();
      return;
    }

    // Don't trigger single-char shortcuts while typing
    if (isTyping) return;

    // ? → Shortcuts help
    if (e.key === "?" || (e.shiftKey && e.key === "/")) {
      e.preventDefault();
      onShortcutsHelp?.();
      return;
    }

    // Space → Pomodoro toggle (only on pomodoro page)
    if (e.key === " " && location.pathname === "/pomodoro") {
      e.preventDefault();
      onPomodoroToggle?.();
      return;
    }

    // Ctrl+N → New note (only on notes page)
    if ((e.metaKey || e.ctrlKey) && e.key === "n" && location.pathname === "/notes") {
      e.preventDefault();
      onNewNote?.();
      return;
    }
  }, [location.pathname, onCommandPalette, onShortcutsHelp, onPomodoroToggle, onNewNote, onCloseModal]);

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}

export { SHORTCUTS };
