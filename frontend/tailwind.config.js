/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg:        "#0B132B",
        "bg-2":    "#0f1a36",
        card:      "rgba(255,255,255,0.05)",
        "card-2":  "rgba(255,255,255,0.08)",
        border:    "rgba(255,255,255,0.10)",
        primary:   "#00FFB2",
        "primary-dim": "rgba(0,255,178,0.12)",
        "primary-container": "#00cc8e",
        secondary: "#adc6ff",
        tertiary:  "#d1bdff",
        surface:   "#0B132B",
        "surface-low":  "#0f1a36",
        "surface-mid":  "#131f3e",
        "surface-high": "#1a2847",
        "surface-top":  "#213050",
        "on-surface":   "#e0e6f0",
        muted:     "#8892a8",
        dim:       "#4a5568",
        accent:    "#00FFB2",
        danger:    "#f87171",
        warning:   "#fbbf24",
        info:      "#60a5fa",
        purple:    "#a78bfa",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "glow":        "glow 2s ease-in-out infinite",
        "float":       "float 3s ease-in-out infinite",
        "fade-up":     "fadeUp .45s cubic-bezier(.22,1,.36,1) both",
        "slide-in":    "slideIn .35s cubic-bezier(.22,1,.36,1) both",
        "slide-up":    "slideUp .4s cubic-bezier(.22,1,.36,1) both",
        "bounce-dot":  "bounce .9s infinite",
      },
    },
  },
  plugins: [],
};
