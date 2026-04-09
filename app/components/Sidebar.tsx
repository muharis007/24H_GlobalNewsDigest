"use client";

import { Country } from "@/types/news";
import StoryCard from "./StoryCard";

interface SidebarProps {
  countries: Country[];
  selectedCountry: string | null;
  onSelectCountry: (code: string | null) => void;
}

export default function Sidebar({ countries, selectedCountry, onSelectCountry }: SidebarProps) {
  const selected = countries.find((c) => c.code === selectedCountry);

  // Sort countries by story count (descending)
  const sorted = [...countries].sort((a, b) => b.stories.length - a.stories.length);

  return (
    <div className="h-full flex flex-col bg-surface border-l border-border">
      {selected ? (
        <>
          {/* Country detail header */}
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <h2 className="font-heading font-bold text-text-main text-lg">{selected.name}</h2>
            <button
              onClick={() => onSelectCountry(null)}
              className="text-text-dim hover:text-text-main transition-colors text-sm font-mono"
            >
              ✕ Close
            </button>
          </div>
          <div className="text-xs text-text-dim px-4 py-2 font-mono border-b border-border shrink-0">
            {selected.stories.length} {selected.stories.length === 1 ? "story" : "stories"}
          </div>
          {/* Story list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {selected.stories.map((story, i) => (
              <StoryCard key={i} story={story} />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Country list header */}
          <div className="p-4 border-b border-border shrink-0">
            <h2 className="font-heading font-bold text-text-main text-sm uppercase tracking-wider">
              Countries
            </h2>
          </div>
          {/* Country list */}
          <div className="flex-1 overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="p-4 text-text-dim text-sm font-mono text-center">
                No data yet. Click FETCH NEWS.
              </div>
            ) : (
              sorted.map((country) => {
                const hasConflict = country.stories.some((s) => s.category === "conflict");
                return (
                  <button
                    key={country.code}
                    onClick={() => onSelectCountry(country.code)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors border-b border-border text-left"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: hasConflict ? "#ff3d71" : "#00e5ff" }}
                    />
                    <span className="flex-1 text-sm font-heading text-text-main">
                      {country.name}
                    </span>
                    <span className="text-xs font-mono text-text-dim bg-surface-2 px-2 py-0.5 rounded">
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
