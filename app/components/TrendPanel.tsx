"use client";

import { Country, Category } from "@/types/news";

const CATEGORY_CONFIG: Record<string, { color: string; icon: string }> = {
  conflict: { color: "#ff3d71", icon: "" },
  politics: { color: "#fbbf24", icon: "" },
  economy: { color: "#34d399", icon: "" },
  sports: { color: "#60a5fa", icon: "" },
  tech: { color: "#a78bfa", icon: "" },
  health: { color: "#f472b6", icon: "" },
  other: { color: "#94a3b8", icon: "" },
};

interface TrendPanelProps {
  countries: Country[];
  onClose: () => void;
}

export default function TrendPanel({ countries, onClose }: TrendPanelProps) {
  // Category distribution
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

  // Find trending words from headlines (simple frequency)
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
    <div className="fixed inset-0 z-[9998] bg-bg/95 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-xl bg-surface border border-border rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-heading font-bold text-text-main text-lg">Trends</h2>
          <button onClick={onClose} className="text-text-dim hover:text-accent-2 text-sm font-mono">✕ Close</button>
        </div>

        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Category Distribution */}
          <div>
            <h3 className="text-xs font-mono text-text-dim uppercase tracking-wider mb-3">Category Distribution</h3>
            <div className="space-y-2">
              {sortedCats.map(([cat, count]) => {
                const cfg = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.other;
                const pct = totalStories > 0 ? (count / totalStories) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-xs w-16 shrink-0 font-mono capitalize" style={{ color: cfg.color }}>
                      {cfg.icon} {cat}
                    </span>
                    <div className="flex-1 h-4 bg-surface-2 rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: cfg.color + "88" }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-text-dim w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Countries */}
          <div>
            <h3 className="text-xs font-mono text-text-dim uppercase tracking-wider mb-3">Top Countries</h3>
            <div className="flex flex-wrap gap-2">
              {sortedCountries.map(([name, count]) => (
                <span key={name} className="text-xs font-mono bg-surface-2 border border-border text-text-main px-3 py-1.5 rounded-full">
                  {name} <span className="text-accent">{count}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Trending Keywords */}
          {trendingWords.length > 0 && (
            <div>
              <h3 className="text-xs font-mono text-text-dim uppercase tracking-wider mb-3">Trending Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {trendingWords.map(([word, count]) => (
                  <span
                    key={word}
                    className="text-xs font-mono bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full"
                  >
                    #{word} <span className="text-text-dim">×{count}</span>
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
