/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg:        "#0b1326",
        "bg-2":    "#111827",
        card:      "rgba(45,52,73,0.6)",
        "card-2":  "rgba(45,52,73,0.8)",
        border:    "rgba(255,255,255,0.05)",
        primary:   "#4be277",
        "primary-dim": "rgba(75,226,119,0.15)",
        "primary-container": "#22c55e",
        secondary: "#adc6ff",
        tertiary:  "#d1bdff",
        surface:   "#0b1326",
        "surface-low":  "#131b2e",
        "surface-mid":  "#171f33",
        "surface-high": "#222a3d",
        "surface-top":  "#2d3449",
        "on-surface":   "#dae2fd",
        muted:     "#bccbb9",
        dim:       "#6b7280",
        accent:    "#4be277",
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
