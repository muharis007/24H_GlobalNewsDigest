"use client";

import { useState } from "react";
import { Category } from "@/types/news";

const ALL_CATEGORIES: Category[] = ["politics", "conflict", "economy", "sports", "tech", "health", "other"];

const CATEGORY_COLORS: Record<string, string> = {
  conflict: "#ff3d71",
  politics: "#fbbf24",
  economy: "#34d399",
  sports: "#60a5fa",
  tech: "#a78bfa",
  health: "#f472b6",
  other: "#94a3b8",
};

export interface UserPrefs {
  favoriteCategories: Category[];
  favoriteCountries: string[];
}

const STORAGE_KEY = "newsglobe-prefs";

export function loadPrefs(): UserPrefs {
  if (typeof window === "undefined") return { favoriteCategories: [], favoriteCountries: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { favoriteCategories: [], favoriteCountries: [] };
}

function savePrefs(prefs: UserPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

interface PreferencesProps {
  availableCountries: string[];
  onClose: () => void;
  onSave: (prefs: UserPrefs) => void;
}

export default function Preferences({ availableCountries, onClose, onSave }: PreferencesProps) {
  const [prefs, setPrefs] = useState<UserPrefs>(loadPrefs);

  const toggleCategory = (cat: Category) => {
    setPrefs((p) => ({
      ...p,
      favoriteCategories: p.favoriteCategories.includes(cat)
        ? p.favoriteCategories.filter((c) => c !== cat)
        : [...p.favoriteCategories, cat],
    }));
  };

  const toggleCountry = (name: string) => {
    setPrefs((p) => ({
      ...p,
      favoriteCountries: p.favoriteCountries.includes(name)
        ? p.favoriteCountries.filter((c) => c !== name)
        : [...p.favoriteCountries, name],
    }));
  };

  const handleSave = () => {
    savePrefs(prefs);
    onSave(prefs);
    onClose();
  };

  const handleReset = () => {
    const empty: UserPrefs = { favoriteCategories: [], favoriteCountries: [] };
    setPrefs(empty);
    savePrefs(empty);
    onSave(empty);
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 md:p-8"
      style={{ background: "color-mix(in srgb, var(--bg) 95%, transparent)" }}
    >
      <div
        className="w-full max-w-md overflow-hidden max-h-[90vh] md:max-h-none flex flex-col"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-display font-bold text-lg" style={{ color: "var(--text)" }}>Preferences</h2>
          <button
            onClick={onClose}
            className="font-data text-sm hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-dim)" }}
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Favorite Categories */}
          <div>
            <h3 className="font-data text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--text-dim)" }}>Favorite Categories</h3>
            <p className="font-serif-body text-[11px] mb-2" style={{ color: "var(--text-dim)" }}>Stories from these categories will be highlighted.</p>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => {
                const active = prefs.favoriteCategories.includes(cat);
                const color = CATEGORY_COLORS[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="flex items-center gap-1.5 font-data text-[11px] px-3 py-1.5 transition-colors capitalize"
                    style={{
                      backgroundColor: active ? color + "33" : "transparent",
                      color: active ? color : "var(--text-dim)",
                      border: `1px solid ${active ? color + "55" : "var(--border)"}`,
                    }}
                  >
                    <span className="cat-dot" style={{ background: color }} />
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Favorite Countries */}
          <div>
            <h3 className="font-data text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--text-dim)" }}>Favorite Countries</h3>
            <p className="font-serif-body text-[11px] mb-2" style={{ color: "var(--text-dim)" }}>These countries will appear first in the sidebar.</p>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {availableCountries.map((name) => {
                const active = prefs.favoriteCountries.includes(name);
                return (
                  <button
                    key={name}
                    onClick={() => toggleCountry(name)}
                    className="font-data text-[11px] px-2.5 py-1 transition-colors"
                    style={{
                      background: active ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "var(--surface2)",
                      color: active ? "var(--accent)" : "var(--text-dim)",
                      border: `1px solid ${active ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "var(--border)"}`,
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center justify-between gap-2" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleReset}
            className="font-data text-xs hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-dim)" }}
          >
            Reset All
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="font-data text-xs px-3 py-1.5 transition-colors"
              style={{ color: "var(--text-dim)", border: "1px solid var(--border)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="font-data text-xs font-bold px-4 py-1.5 transition-colors"
              style={{ background: "var(--accent)", color: "var(--bg)" }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
