import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface2)",
        accent: "var(--accent)",
        "accent-2": "var(--accent2)",
        "text-main": "var(--text)",
        "text-dim": "var(--text-dim)",
        border: "var(--border)",
        ink: "var(--ink)",
        "paper-bg": "var(--paper-bg)",
        "paper-text": "var(--paper-text)",
        "map-bg": "var(--map-bg)",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        display: ["Playfair Display", "Georgia", "serif"],
        serif: ["Source Serif 4", "Georgia", "serif"],
        heading: ["Playfair Display", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
