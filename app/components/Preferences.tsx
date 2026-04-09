"use client";

import { useState, useEffect } from "react";
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
    <div className="fixed inset-0 z-[9998] bg-bg/95 flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-heading font-bold text-text-main text-lg">⚙️ Preferences</h2>
          <button onClick={onClose} className="text-text-dim hover:text-accent-2 text-sm font-mono">✕</button>
        </div>

        <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Favorite Categories */}
          <div>
            <h3 className="text-xs font-mono text-text-dim uppercase tracking-wider mb-3">Favorite Categories</h3>
            <p className="text-[10px] font-mono text-text-dim mb-2">Stories from these categories will be highlighted.</p>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => {
                const active = prefs.favoriteCategories.includes(cat);
                const color = CATEGORY_COLORS[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="text-[11px] font-mono px-3 py-1.5 rounded-full transition-colors capitalize"
                    style={{
                      backgroundColor: active ? color + "33" : "transparent",
                      color: active ? color : "#64748b",
                      border: `1px solid ${active ? color + "55" : "#1e293b"}`,
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Favorite Countries */}
          <div>
            <h3 className="text-xs font-mono text-text-dim uppercase tracking-wider mb-3">Favorite Countries</h3>
            <p className="text-[10px] font-mono text-text-dim mb-2">These countries will appear first in the sidebar.</p>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {availableCountries.map((name) => {
                const active = prefs.favoriteCountries.includes(name);
                return (
                  <button
                    key={name}
                    onClick={() => toggleCountry(name)}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded transition-colors ${
                      active
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "bg-surface-2 text-text-dim border border-border hover:text-text-main"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between gap-2">
          <button
            onClick={handleReset}
            className="text-xs font-mono text-text-dim hover:text-accent-2 transition-colors"
          >
            Reset All
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs font-mono text-text-dim hover:text-text-main px-3 py-1.5 rounded border border-border transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-xs font-mono bg-accent text-bg font-bold px-4 py-1.5 rounded hover:bg-accent/80 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
