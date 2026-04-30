/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg:        "#0B1220",
        "bg-2":    "#111827",
        card:      "rgba(255,255,255,0.03)",
        "card-2":  "rgba(255,255,255,0.05)",
        border:    "rgba(255,255,255,0.08)",
        primary:   "#00C896",
        "primary-dim": "rgba(0,200,150,0.12)",
        "primary-container": "#00DDA6",
        secondary: "#3b82f6",
        tertiary:  "#8b5cf6",
        surface:   "#0B1220",
        "surface-low":  "#111827",
        "surface-mid":  "#1f2937",
        "surface-high": "#374151",
        "surface-top":  "#4b5563",
        "on-surface":   "#f3f4f6",
        muted:     "#9ca3af",
        dim:       "#6b7280",
        accent:    "#00C896",
        danger:    "#f87171",
        warning:   "#fbbf24",
        info:      "#3b82f6",
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
