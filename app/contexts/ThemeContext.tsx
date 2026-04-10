"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Theme {
  name: "light" | "dark";
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  textDim: string;
  border: string;
  accent: string;
  accent2: string;
  mapBg: string;
  paperBg: string;
  paperText: string;
  ink: string;
}

const DARK_THEME: Theme = {
  name: "dark",
  bg: "#0a0e17",
  surface: "#111827",
  surface2: "#1a2236",
  text: "#e2e8f0",
  textDim: "#64748b",
  border: "#1e293b",
  accent: "#00e5ff",
  accent2: "#ff3d71",
  mapBg: "#0b1120",
  paperBg: "#111827",
  paperText: "#e2e8f0",
  ink: "#cbd5e1",
};

const LIGHT_THEME: Theme = {
  name: "light",
  bg: "#f5f0e8",
  surface: "#faf6ee",
  surface2: "#ede8db",
  text: "#1a1a1a",
  textDim: "#6b6b6b",
  border: "#d4cfc4",
  accent: "#0077b6",
  accent2: "#c1121f",
  mapBg: "#e8e0d0",
  paperBg: "#faf6ee",
  paperText: "#1a1a1a",
  ink: "#2d2d2d",
};

interface ThemeContextValue {
  theme: Theme;
  mode: "light" | "dark";
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DARK_THEME,
  mode: "dark",
  toggleMode: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = "newsglobe-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setMode(stored);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setMode("light");
    }
  }, []);

  useEffect(() => {
    const theme = mode === "light" ? LIGHT_THEME : DARK_THEME;
    const root = document.documentElement;
    root.style.setProperty("--bg", theme.bg);
    root.style.setProperty("--surface", theme.surface);
    root.style.setProperty("--surface2", theme.surface2);
    root.style.setProperty("--text", theme.text);
    root.style.setProperty("--text-dim", theme.textDim);
    root.style.setProperty("--border", theme.border);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent2", theme.accent2);
    root.style.setProperty("--map-bg", theme.mapBg);
    root.style.setProperty("--paper-bg", theme.paperBg);
    root.style.setProperty("--paper-text", theme.paperText);
    root.style.setProperty("--ink", theme.ink);
    root.setAttribute("data-theme", mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggleMode = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  const theme = mode === "light" ? LIGHT_THEME : DARK_THEME;

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
