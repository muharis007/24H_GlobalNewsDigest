import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0e17",
        surface: "#111827",
        "surface-2": "#1a2236",
        accent: "#00e5ff",
        "accent-2": "#ff3d71",
        "text-main": "#e2e8f0",
        "text-dim": "#64748b",
        border: "#1e293b",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        heading: ["Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
