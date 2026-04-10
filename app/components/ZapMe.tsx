"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { NewsData } from "@/types/news";

interface ZapMeProps {
  news: NewsData;
  onClose: () => void;
}

interface ZapEntry {
  country: string;
  countryCode: string;
  headline: string;
  summary: string;
  source: string;
  link?: string;
}

type ZapLine =
  | { type: "category"; category: string; count: number }
  | { type: "country"; name: string; code: string }
  | { type: "story"; headline: string; summary: string; source: string; link?: string };

const CATEGORY_COLORS: Record<string, string> = {
  conflict: "#ff3d71",
  politics: "#fbbf24",
  economy: "#34d399",
  health: "#f472b6",
  tech: "#a78bfa",
  sports: "#60a5fa",
  other: "#94a3b8",
};

const CATEGORY_ORDER = [
  { key: "conflict", label: "CONFLICT" },
  { key: "politics", label: "POLITICS" },
  { key: "economy", label: "ECONOMY" },
  { key: "health", label: "HEALTH" },
  { key: "tech", label: "TECH" },
  { key: "sports", label: "SPORTS" },
  { key: "other", label: "OTHER" },
];

const CONFLICT_PRIORITY = new Set(["PSE", "UKR", "SYR", "IRQ", "AFG", "YEM", "SDN", "SOM", "MMR", "LBY"]);

function buildLines(news: NewsData): ZapLine[] {
  const byCat = new Map<string, ZapEntry[]>();
  for (const country of news.countries) {
    for (const story of country.stories) {
      const cat = story.category;
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat)!.push({
        country: country.name,
        countryCode: country.code,
        headline: story.headline,
        summary: story.summary,
        source: story.source,
        link: story.link,
      });
    }
  }

  const lines: ZapLine[] = [];

  for (const { key } of CATEGORY_ORDER) {
    const entries = byCat.get(key);
    if (!entries || entries.length === 0) continue;

    const byCountry = new Map<string, ZapEntry[]>();
    for (const e of entries) {
      if (!byCountry.has(e.countryCode)) byCountry.set(e.countryCode, []);
      byCountry.get(e.countryCode)!.push(e);
    }

    const sortedCodes = Array.from(byCountry.keys()).sort((a, b) => {
      const aPri = CONFLICT_PRIORITY.has(a) ? 0 : 1;
      const bPri = CONFLICT_PRIORITY.has(b) ? 0 : 1;
      if (aPri !== bPri) return aPri - bPri;
      return (byCountry.get(a)![0].country).localeCompare(byCountry.get(b)![0].country);
    });

    lines.push({ type: "category", category: key, count: entries.length });

    for (const code of sortedCodes) {
      const countryEntries = byCountry.get(code)!;
      lines.push({ type: "country", name: countryEntries[0].country, code });
      for (const e of countryEntries) {
        lines.push({ type: "story", headline: e.headline, summary: e.summary, source: e.source, link: e.link });
      }
    }
  }

  return lines;
}

function getBaseDelay(line: ZapLine): number {
  switch (line.type) {
    case "category": return 1200;
    case "country": return 600;
    case "story": return 1800;
  }
}

const SPEED_MULTIPLIERS: Record<number, number> = { 1: 1, 1.5: 0.67, 2: 0.5 };

export default function ZapMe({ news, onClose }: ZapMeProps) {
  const lines = useMemo(() => buildLines(news), [news]);
  const totalLines = lines.length;
  const totalStories = lines.filter((l) => l.type === "story").length;
  const totalCategories = lines.filter((l) => l.type === "category").length;

  const [visibleCount, setVisibleCount] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);
  const ignoreScrollRef = useRef(false);

  const allDone = visibleCount >= totalLines;

  // Current section
  const currentCategoryIdx = lines.slice(0, visibleCount).filter(l => l.type === "category").length;
  const currentCategory = lines.slice(0, visibleCount).reverse().find(l => l.type === "category");

  useEffect(() => {
    if (isPaused || allDone) return;
    const currentLine = lines[visibleCount];
    if (!currentLine) return;
    const delay = getBaseDelay(currentLine) * (SPEED_MULTIPLIERS[speed] ?? 1);
    const timer = setTimeout(() => setVisibleCount((prev) => prev + 1), delay);
    return () => clearTimeout(timer);
  }, [visibleCount, isPaused, speed, allDone, lines]);

  useEffect(() => {
    if (userScrolledUp || !latestRef.current) return;
    ignoreScrollRef.current = true;
    latestRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => { ignoreScrollRef.current = false; }, 400);
    return () => clearTimeout(t);
  }, [visibleCount, userScrolledUp]);

  const handleScroll = useCallback(() => {
    if (ignoreScrollRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    setUserScrolledUp(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); setIsPaused((p) => !p); }
      else if (e.code === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const progress = totalLines > 0 ? (visibleCount / totalLines) * 100 : 0;
  const readingMinutes = Math.max(1, Math.round(totalStories * 0.1));

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: "var(--bg)", isolation: "isolate" }}>
      {/* Progress bar */}
      <div className="h-[2px] w-full shrink-0" style={{ background: "var(--surface2)" }}>
        <div className="h-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: "var(--accent)" }} />
      </div>

      {/* Header */}
      <div className="shrink-0 px-4 md:px-8 pt-5 pb-3 max-w-[600px] w-full mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display font-bold text-xl tracking-[0.05em]" style={{ color: "var(--text)" }}>
              ZAP ME
            </h2>
            <p className="font-serif-body text-xs mt-1" style={{ color: "var(--text-dim)" }}>
              {totalStories} stories in ~{readingMinutes} min
            </p>
            <p className="font-data text-[9px] mt-0.5 uppercase tracking-[0.1em]" style={{ color: "var(--text-dim)" }}>
              AI-generated summaries -- Verify with original sources
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[1, 1.5, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className="font-data text-[11px] px-2.5 py-1 transition-colors"
                style={{
                  background: speed === s ? "var(--accent)" : "var(--surface2)",
                  color: speed === s ? "var(--bg)" : "var(--text-dim)",
                  fontWeight: speed === s ? "bold" : "normal",
                }}
              >
                {s}x
              </button>
            ))}
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="font-data text-sm px-2.5 py-1 transition-colors"
              style={{ background: "var(--surface2)", color: "var(--text-dim)" }}
              title={isPaused ? "Play (Space)" : "Pause (Space)"}
            >
              {isPaused ? "\u25B6" : "||"}
            </button>
            <button
              onClick={onClose}
              className="font-data text-sm px-2.5 py-1 transition-colors hover:opacity-70"
              style={{ background: "var(--surface2)", color: "var(--text-dim)" }}
              title="Close (Esc)"
            >
              X
            </button>
          </div>
        </div>
        {/* Page indicator */}
        <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="font-data text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--text-dim)" }}>
            Section {currentCategoryIdx} of {totalCategories}
            {currentCategory && currentCategory.type === "category" && (
              <> -- {CATEGORY_ORDER.find(c => c.key === currentCategory.category)?.label}</>
            )}
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onClick={() => { if (window.innerWidth < 768) setIsPaused((p) => !p); }}
        className="flex-1 overflow-y-auto px-4 md:px-8 pb-20"
      >
        <div className="max-w-[600px] mx-auto">
          {lines.slice(0, visibleCount).map((line, i) => {
            const isLatest = i === visibleCount - 1;
            const catColor = line.type === "category" ? (CATEGORY_COLORS[line.category] || "#94a3b8") : undefined;
            return (
              <div key={i} ref={isLatest ? latestRef : undefined} className="zap-line-enter">
                {line.type === "category" && (
                  <div className="pt-8 pb-2" style={{ borderTop: "3px double var(--border)" }}>
                    <div className="flex items-center gap-2">
                      <span className="cat-dot" style={{ background: catColor }} />
                      <span className="font-serif-body italic text-[12px] uppercase tracking-[0.15em]" style={{ color: catColor }}>
                        {CATEGORY_ORDER.find(c => c.key === line.category)?.label}
                      </span>
                      <span className="font-data text-[10px]" style={{ color: "var(--text-dim)" }}>
                        ({line.count} {line.count === 1 ? "story" : "stories"})
                      </span>
                    </div>
                  </div>
                )}
                {line.type === "country" && (
                  <div className="pt-4 pb-1">
                    <span className="iso-badge mr-2">{line.code}</span>
                    <span className="font-display font-semibold text-sm" style={{ color: "var(--text)" }}>
                      {line.name}
                    </span>
                  </div>
                )}
                {line.type === "story" && (
                  <div
                    className="pl-4 py-2 transition-colors duration-300"
                    style={{
                      borderLeft: isLatest && !allDone ? "3px solid var(--accent)" : "3px solid transparent",
                    }}
                  >
                    <p className="font-serif-body text-[14px] leading-[1.6]" style={{ color: "var(--ink)" }}>
                      <span style={{ color: "var(--accent)", marginRight: "6px" }}>{"\u25B8"}</span>
                      {line.headline}.
                    </p>
                    {line.summary && (
                      <p className="font-serif-body text-[13px] leading-[1.6] pl-4 mt-0.5" style={{ color: "var(--text-dim)" }}>
                        {line.summary}
                        {line.link && (
                          <a
                            href={line.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 hover:opacity-70 transition-opacity"
                            style={{ color: "var(--accent)" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Read more
                          </a>
                        )}
                      </p>
                    )}
                    <p className="font-data text-[10px] uppercase tracking-[0.1em] mt-1 text-right" style={{ color: "var(--text-dim)" }}>
                      {line.source}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {allDone && (
            <div className="flex flex-col items-center justify-center pt-10 pb-6 zap-line-enter">
              <div className="rule-double-top w-32 mb-4" />
              <p className="font-display font-bold text-lg" style={{ color: "var(--text)" }}>
                You are all caught up.
              </p>
              <p className="font-data text-xs mt-1" style={{ color: "var(--text-dim)" }}>
                {totalStories} stories across {lines.filter((l) => l.type === "country").length} countries
              </p>
              <button
                onClick={onClose}
                className="mt-4 border font-display text-[11px] px-6 py-2 tracking-[0.1em] uppercase hover:opacity-80 transition-opacity"
                style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
              >
                Back to Map
              </button>
            </div>
          )}
        </div>
      </div>

      {isPaused && !allDone && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 flex items-center gap-2 backdrop-blur"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "4px" }}
        >
          <span className="font-data text-xs" style={{ color: "var(--accent)" }}>PAUSED</span>
          <span className="font-data text-[10px] hidden sm:inline" style={{ color: "var(--text-dim)" }}>Press Space to resume</span>
        </div>
      )}
    </div>
  );
}
