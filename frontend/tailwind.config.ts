import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",   // ← THIS LINE — Tailwind reads .dark class on <html>
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  important: "#root",
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          900: "#1e1b4b",
        },
        gamification: {
          xp:     "#f59e0b",
          level:  "#8b5cf6",
          streak: "#10b981",
        },
        mood: {
          great: "#22c55e",
          good:  "#86efac",
          okay:  "#fbbf24",
          bad:   "#f87171",
          awful: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Bumped up across the board
        xs:   ["0.8rem",  { lineHeight: "1.2rem" }],
        sm:   ["0.925rem",{ lineHeight: "1.4rem" }],
        base: ["1.05rem", { lineHeight: "1.7rem" }],
        lg:   ["1.15rem", { lineHeight: "1.8rem" }],
        xl:   ["1.3rem",  { lineHeight: "1.9rem" }],
        "2xl":["1.6rem",  { lineHeight: "2.1rem" }],
        "3xl":["2rem",    { lineHeight: "2.4rem" }],
        "4xl":["2.5rem",  { lineHeight: "2.9rem" }],
      },
      animation: {
        "fade-in":   "fadeIn 0.2s ease-in-out",
        "slide-up":  "slideUp 0.3s ease-out",
        "bounce-xp": "bounceXP 0.5s ease-out",
      },
      keyframes: {
        fadeIn:   { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp:  { from: { transform: "translateY(10px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        bounceXP: { "0%, 100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.2)" } },
      },
    },
  },
  plugins: [],
};

export default config;
