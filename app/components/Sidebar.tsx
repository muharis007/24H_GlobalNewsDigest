"use client";

import { Country } from "@/types/news";
import StoryCard from "./StoryCard";

interface SidebarProps {
  countries: Country[];
  selectedCountry: string | null;
  onSelectCountry: (code: string | null) => void;
  favoriteCountries?: string[];
}

export default function Sidebar({ countries, selectedCountry, onSelectCountry, favoriteCountries = [] }: SidebarProps) {
  const selected = countries.find((c) => c.code === selectedCountry);

  const favSet = new Set(favoriteCountries);
  const sorted = [...countries].sort((a, b) => {
    const aFav = favSet.has(a.name) ? 0 : 1;
    const bFav = favSet.has(b.name) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    return b.stories.length - a.stories.length;
  });

  return (
    <div className="h-full flex flex-col column-rule" style={{ background: "var(--paper-bg)" }}>
      {/* AI Disclaimer */}
      <div className="px-3 py-1.5 shrink-0 text-center" style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
        <p className="font-data text-[9px] uppercase tracking-[0.1em]" style={{ color: "var(--text-dim)" }}>
          AI-generated content -- Verify with original sources
        </p>
      </div>

      {selected ? (
        <>
          {/* Country detail header */}
          <div className="p-4 flex items-center justify-between shrink-0" style={{ borderBottom: "3px double var(--border)" }}>
            <div>
              <span className="iso-badge mr-2">{selected.code}</span>
              <h2 className="inline font-display font-bold text-lg" style={{ color: "var(--text)" }}>
                {selected.name}
              </h2>
            </div>
            <button
              onClick={() => onSelectCountry(null)}
              className="font-data text-[11px] hover:opacity-70 transition-opacity"
              style={{ color: "var(--text-dim)" }}
            >
              CLOSE
            </button>
          </div>
          <div className="font-data text-[10px] px-4 py-1.5 shrink-0 uppercase tracking-[0.1em]" style={{ color: "var(--text-dim)", borderBottom: "1px solid var(--border)" }}>
            {selected.stories.length} {selected.stories.length === 1 ? "story" : "stories"}
          </div>
          {/* Story list */}
          <div className="flex-1 overflow-y-auto px-4">
            {selected.stories.map((story, i) => (
              <StoryCard key={i} story={story} isLead={i === 0} />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Country list header */}
          <div className="p-4 shrink-0" style={{ borderBottom: "3px double var(--border)" }}>
            <h2 className="font-display font-bold text-sm uppercase tracking-[0.15em]" style={{ color: "var(--text)" }}>
              Countries
            </h2>
          </div>
          {/* Country list */}
          <div className="flex-1 overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="p-4 text-center">
                <p className="font-serif-body text-sm" style={{ color: "var(--text-dim)" }}>
                  No data yet. News will be fetched automatically.
                </p>
              </div>
            ) : (
              sorted.map((country) => {
                const hasConflict = country.stories.some((s) => s.category === "conflict");
                const isSelected = selectedCountry === country.code;
                return (
                  <button
                    key={country.code}
                    onClick={() => onSelectCountry(country.code)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface2)] transition-colors text-left"
                    style={{
                      borderBottom: "1px solid var(--border)",
                      borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent",
                    }}
                  >
                    <span className="iso-badge shrink-0">{country.code}</span>
                    <span className="flex-1 font-serif-body text-sm" style={{ color: "var(--text)" }}>
                      {favSet.has(country.name) && (
                        <span className="mr-1" style={{ color: "var(--accent)" }}>*</span>
                      )}
                      {country.name}
                    </span>
                    <span
                      className="cat-dot shrink-0"
                      style={{ background: hasConflict ? "var(--accent2)" : "var(--accent)", marginRight: 0 }}
                    />
                    <span className="font-data text-[10px] px-2 py-0.5 rounded" style={{ color: "var(--text-dim)", background: "var(--surface2)" }}>
                      {country.stories.length}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
