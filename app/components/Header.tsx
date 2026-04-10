"use client";

import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

interface HeaderProps {
  updatedAt: string | null;
  storyCount: number;
  countryCount: number;
  loading: boolean;
  hasNews: boolean;
  onZap: () => void;
  onTimeline: () => void;
  onTrends: () => void;
  onPrefs: () => void;
}

function getEditionLabel(): string {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 12) return "MORNING EDITION";
  if (hour < 18) return "AFTERNOON EDITION";
  return "EVENING EDITION";
}

function getDateLine(): string {
  const now = new Date();
  return now.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).toUpperCase();
}

export default function Header({ updatedAt, storyCount, countryCount, loading, hasNews, onZap, onTimeline, onTrends, onPrefs }: HeaderProps) {
  const { mode, toggleMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const disabledClass = !hasNews
    ? "opacity-[0.35] cursor-not-allowed pointer-events-none"
    : "";

  const btnBase = "border border-[var(--border)] text-[var(--text-dim)] font-display text-[10px] px-3 py-1.5 tracking-[0.1em] uppercase hover:bg-[var(--surface2)] hover:text-[var(--text)] transition-colors";

  return (
    <header className="shrink-0 z-50" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
      {/* Masthead */}
      <div className="text-center py-3 md:py-4">
        <h1
          className="font-display font-bold tracking-[0.15em] text-2xl md:text-3xl"
          style={{ color: "var(--text)" }}
        >
          N E W S G L O B E
        </h1>
        <p
          className="font-display italic text-xs md:text-sm mt-0.5 tracking-wide"
          style={{ color: "var(--text-dim)" }}
        >
          24-Hour Global News Intelligence
        </p>
      </div>

      {/* Edition line */}
      <div
        className="text-center py-1.5 px-4"
        style={{
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <p className="font-data text-[10px] tracking-[0.15em] uppercase" style={{ color: "var(--text-dim)" }}>
          {getDateLine()}
          <span className="mx-2" style={{ color: "var(--border)" }}>//</span>
          {getEditionLabel()}
          {storyCount > 0 && (
            <>
              <span className="mx-2" style={{ color: "var(--border)" }}>//</span>
              <span style={{ color: "var(--accent)" }}>{storyCount} Stories</span>
              <span className="mx-2" style={{ color: "var(--border)" }}>//</span>
              {countryCount} Countries
            </>
          )}
          {loading && (
            <>
              <span className="mx-2" style={{ color: "var(--border)" }}>//</span>
              <span className="animate-pulse" style={{ color: "var(--accent)" }}>Scanning...</span>
            </>
          )}
        </p>
      </div>

      {/* Button row - desktop */}
      <div className="hidden md:flex items-center justify-center gap-2 py-2 px-4">
        <button onClick={onPrefs} disabled={!hasNews} className={`${btnBase} ${disabledClass}`}>
          Settings
        </button>
        <button onClick={onTrends} disabled={!hasNews} className={`${btnBase} ${disabledClass}`}>
          Trends
        </button>
        <button onClick={onTimeline} disabled={!hasNews} className={`${btnBase} ${disabledClass}`}>
          Timeline
        </button>
        <button
          onClick={onZap}
          disabled={!hasNews}
          className={`border font-display text-[10px] px-3 py-1.5 tracking-[0.1em] uppercase transition-colors ${
            !hasNews
              ? "opacity-[0.35] cursor-not-allowed pointer-events-none border-[var(--border)] text-[var(--text-dim)]"
              : "border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg)]"
          }`}
        >
          Zap Me
        </button>
        <button onClick={toggleMode} className={btnBase}>
          {mode === "dark" ? "Light" : "Dark"}
        </button>
      </div>

      {/* Mobile button row */}
      <div className="md:hidden flex items-center justify-center gap-2 py-2 px-4">
        <button onClick={toggleMode} className={btnBase}>
          {mode === "dark" ? "Light" : "Dark"}
        </button>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={btnBase}
        >
          Menu
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div
          className="md:hidden flex flex-col gap-2 p-3"
          style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
        >
          <button onClick={() => { onPrefs(); setMobileMenuOpen(false); }} disabled={!hasNews} className={`w-full text-left ${btnBase} ${disabledClass}`}>
            Settings
          </button>
          <button onClick={() => { onTrends(); setMobileMenuOpen(false); }} disabled={!hasNews} className={`w-full text-left ${btnBase} ${disabledClass}`}>
            Trends
          </button>
          <button onClick={() => { onTimeline(); setMobileMenuOpen(false); }} disabled={!hasNews} className={`w-full text-left ${btnBase} ${disabledClass}`}>
            Timeline
          </button>
          <button
            onClick={() => { onZap(); setMobileMenuOpen(false); }}
            disabled={!hasNews}
            className={`w-full text-left border font-display text-[10px] px-3 py-1.5 tracking-[0.1em] uppercase transition-colors ${
              !hasNews
                ? "opacity-[0.35] cursor-not-allowed pointer-events-none border-[var(--border)] text-[var(--text-dim)]"
                : "border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg)]"
            }`}
          >
            Zap Me
          </button>
        </div>
      )}
    </header>
  );
}
