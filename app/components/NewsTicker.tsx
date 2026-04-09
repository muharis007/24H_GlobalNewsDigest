"use client";

import { Country } from "@/types/news";

interface NewsTickerProps {
  countries: Country[];
}

export default function NewsTicker({ countries }: NewsTickerProps) {
  const breakingStories = countries.flatMap((c) =>
    c.stories
      .filter((s) => s.breaking)
      .map((s) => ({ country: c.name, headline: s.headline }))
  );

  if (breakingStories.length === 0) return null;

  // Duplicate for seamless loop
  const items = [...breakingStories, ...breakingStories];

  return (
    <div className="bg-accent-2/10 border-b border-accent-2/30 h-8 flex items-center overflow-hidden shrink-0 relative">
      <span className="shrink-0 bg-accent-2 text-bg text-[10px] font-mono font-bold px-3 py-1 uppercase tracking-wider z-10">
        Breaking
      </span>
      <div className="overflow-hidden flex-1 relative">
        <div className="ticker-scroll flex items-center gap-8 whitespace-nowrap">
          {items.map((item, i) => (
            <span key={i} className="text-xs font-mono text-text-main">
              <span className="text-accent-2 mr-1">●</span>
              <span className="text-text-dim mr-1">{item.country}:</span>
              {item.headline}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
