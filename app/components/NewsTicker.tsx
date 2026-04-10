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
    <div
      className="h-8 flex items-center overflow-hidden shrink-0 relative"
      style={{ background: "color-mix(in srgb, var(--accent2) 8%, var(--bg))", borderBottom: "1px solid color-mix(in srgb, var(--accent2) 25%, transparent)" }}
    >
      <span
        className="shrink-0 font-data text-[10px] font-bold px-3 py-1 uppercase tracking-[0.1em] z-10"
        style={{ background: "var(--accent2)", color: "var(--bg)" }}
      >
        BREAKING
      </span>
      <div className="overflow-hidden flex-1 relative">
        <div className="ticker-scroll flex items-center gap-8 whitespace-nowrap">
          {items.map((item, i) => (
            <span key={i} className="font-serif-body text-xs" style={{ color: "var(--text)" }}>
              <span style={{ color: "var(--accent2)", margin: "0 6px" }}>|</span>
              <span className="font-data text-[10px] uppercase" style={{ color: "var(--text-dim)" }}>{item.country}:</span>
              {" "}{item.headline}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
