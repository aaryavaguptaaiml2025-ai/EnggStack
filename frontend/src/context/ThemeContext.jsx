import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeCtx = createContext(null);

export const THEMES = {
  dark: {
    id: "dark", label: "Dark", bg: "#0B1220", bg2: "#111827", surface: "#0B1220",
    card: "rgba(255,255,255,0.03)", card2: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.08)", text: "#f3f4f6", muted: "#9ca3af", dim: "#6b7280",
    glow: "#00C896", accent: "#00C896",
  },
  midnight: {
    id: "midnight", label: "Midnight", bg: "#060818", bg2: "#0a0d26", surface: "#060818",
    card: "rgba(10,13,38,0.6)", card2: "rgba(10,13,38,0.8)",
    border: "rgba(99,102,241,0.12)", text: "#e0e7ff", muted: "#818cf8", dim: "#6366f1",
    glow: "#818cf8", accent: "#818cf8",
  },
  forest: {
    id: "forest", label: "Forest", bg: "#080d08", bg2: "#0d170d", surface: "#080d08",
    card: "rgba(13,23,13,0.6)", card2: "rgba(13,23,13,0.8)",
    border: "rgba(52,211,153,0.12)", text: "#d1fae5", muted: "#6ee7b7", dim: "#34d399",
    glow: "#34d399", accent: "#34d399",
  },
  ocean: {
    id: "ocean", label: "Ocean", bg: "#050d14", bg2: "#081621", surface: "#050d14",
    card: "rgba(8,22,33,0.6)", card2: "rgba(8,22,33,0.8)",
    border: "rgba(56,189,248,0.12)", text: "#e0f2fe", muted: "#7dd3fc", dim: "#38bdf8",
    glow: "#38bdf8", accent: "#38bdf8",
  },
  candy: {
    id: "candy", label: "Candy", bg: "#0f0a1a", bg2: "#1a112c", surface: "#0f0a1a",
    card: "rgba(26,17,44,0.6)", card2: "rgba(26,17,44,0.8)",
    border: "rgba(244,114,182,0.12)", text: "#fce7f3", muted: "#f9a8d4", dim: "#f472b6",
    glow: "#f472b6", accent: "#f472b6",
  },
};

function applyThemeToDOM(themeId, accentColor) {
  const theme = THEMES[themeId] || THEMES.dark;
  const root = document.documentElement;

  root.setAttribute("data-theme", themeId);

  // Apply all CSS variables
  root.style.setProperty("--bg", theme.bg);
  root.style.setProperty("--bg2", theme.bg2);
  root.style.setProperty("--surface", theme.surface);
  root.style.setProperty("--card", theme.card);
  root.style.setProperty("--card2", theme.card2);
  root.style.setProperty("--border", theme.border);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--muted", theme.muted);
  root.style.setProperty("--dim", theme.dim);
  root.style.setProperty("--glow", theme.glow);

  const ac = accentColor || theme.accent;
  root.style.setProperty("--ac", ac);
  root.style.setProperty("--ac-dim", ac + "15");
  root.style.setProperty("--ac2", ac);

  // Background color
  document.body.style.background = theme.bg;
  document.body.style.transition = "background 0.6s cubic-bezier(0.4,0,0.2,1)";
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem("cognit-theme") || "dark";
  });
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem("cognit-accent") || "#00C896";
  });

  // Apply theme on mount and changes
  useEffect(() => {
    applyThemeToDOM(themeId, accentColor);
  }, [themeId, accentColor]);

  const changeTheme = useCallback((id) => {
    setThemeId(id);
    localStorage.setItem("cognit-theme", id);
    // Add transition class
    document.documentElement.classList.add("theme-transitioning");
    setTimeout(() => document.documentElement.classList.remove("theme-transitioning"), 600);
  }, []);

  const changeAccent = useCallback((color) => {
    setAccentColor(color);
    localStorage.setItem("cognit-accent", color);
  }, []);

  return (
    <ThemeCtx.Provider value={{ themeId, accentColor, changeTheme, changeAccent, themes: THEMES }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
