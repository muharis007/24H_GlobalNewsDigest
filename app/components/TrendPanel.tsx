"use client";

import { Country } from "@/types/news";

const CATEGORY_CONFIG: Record<string, { color: string }> = {
  conflict: { color: "#ff3d71" },
  politics: { color: "#fbbf24" },
  economy: { color: "#34d399" },
  sports: { color: "#60a5fa" },
  tech: { color: "#a78bfa" },
  health: { color: "#f472b6" },
  other: { color: "#94a3b8" },
};

interface TrendPanelProps {
  countries: Country[];
  onClose: () => void;
}

export default function TrendPanel({ countries, onClose }: TrendPanelProps) {
  const catCounts = new Map<string, number>();
  const topCountries = new Map<string, number>();

  for (const c of countries) {
    topCountries.set(c.name, (topCountries.get(c.name) ?? 0) + c.stories.length);
    for (const s of c.stories) {
      catCounts.set(s.category, (catCounts.get(s.category) ?? 0) + 1);
    }
  }

  const totalStories = countries.reduce((sum, c) => sum + c.stories.length, 0);
  const sortedCats = Array.from(catCounts.entries()).sort((a, b) => b[1] - a[1]);
  const sortedCountries = Array.from(topCountries.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const wordCounts = new Map<string, number>();
  const stopWords = new Set(["the", "a", "an", "in", "on", "at", "to", "for", "of", "is", "and", "or", "with", "by", "from", "as", "has", "have", "had", "be", "been", "was", "were", "are", "its", "it", "that", "this", "will", "after", "over", "says", "said", "new"]);
  for (const c of countries) {
    for (const s of c.stories) {
      const words = s.headline.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/);
      for (const w of words) {
        if (w.length > 3 && !stopWords.has(w)) {
          wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
        }
      }
    }
  }
  const trendingWords = Array.from(wordCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 md:p-8"
      style={{ background: "color-mix(in srgb, var(--bg) 95%, transparent)" }}
    >
      <div
        className="w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-display font-bold text-lg" style={{ color: "var(--text)" }}>Trends</h2>
          <button
            onClick={onClose}
            className="font-data text-sm hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-dim)" }}
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Category Distribution */}
          <div>
            <h3 className="font-data text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--text-dim)" }}>Category Distribution</h3>
            <div className="space-y-2">
              {sortedCats.map(([cat, count]) => {
                const cfg = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.other;
                const pct = totalStories > 0 ? (count / totalStories) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 font-data text-xs w-20 shrink-0 capitalize" style={{ color: cfg.color }}>
                      <span className="cat-dot" style={{ background: cfg.color }} />
                      {cat}
                    </span>
                    <div className="flex-1 h-4 overflow-hidden" style={{ background: "var(--surface2)" }}>
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: cfg.color + "88" }}
                      />
                    </div>
                    <span className="font-data text-[10px] w-8 text-right" style={{ color: "var(--text-dim)" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Countries */}
          <div>
            <h3 className="font-data text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--text-dim)" }}>Top Countries</h3>
            <div className="flex flex-wrap gap-2">
              {sortedCountries.map(([name, count]) => (
                <span
                  key={name}
                  className="font-data text-xs px-3 py-1.5"
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
                >
                  {name} <span style={{ color: "var(--accent)" }}>{count}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Trending Keywords */}
          {trendingWords.length > 0 && (
            <div>
              <h3 className="font-data text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: "var(--text-dim)" }}>Trending Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {trendingWords.map(([word, count]) => (
                  <span
                    key={word}
                    className="font-data text-xs px-3 py-1"
                    style={{
                      background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                      color: "var(--accent)",
                      border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                    }}
                  >
                    #{word} <span style={{ color: "var(--text-dim)" }}>{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
