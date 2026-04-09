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

interface ZapCategory {
  category: string;
  icon: string;
  entries: ZapEntry[];
}

type ZapLine =
  | { type: "category"; category: string; icon: string; count: number }
  | { type: "country"; name: string; flag: string }
  | { type: "story"; headline: string; summary: string; source: string; link?: string };

const FLAGS: Record<string, string> = {
  PAK: "PK", SAU: "SA", GBR: "GB", USA: "US",
  IND: "IN", CHN: "CN", RUS: "RU", IRN: "IR",
  ISR: "IL", UKR: "UA", AFG: "AF", IRQ: "IQ",
  SYR: "SY", TUR: "TR", EGY: "EG", FRA: "FR",
  DEU: "DE", JPN: "JP", KOR: "KR", AUS: "AU",
  PSE: "PS", LBN: "LB", ARE: "AE", QAT: "QA",
  KWT: "KW", OMN: "OM", BHR: "BH", YEM: "YE",
  JOR: "JO", LBY: "LY", SDN: "SD", SOM: "SO",
  NGA: "NG", ZAF: "ZA", BRA: "BR", MEX: "MX",
  CAN: "CA", ITA: "IT", ESP: "ES", POL: "PL",
  NLD: "NL", BEL: "BE", GRC: "GR", BGD: "BD",
  LKA: "LK", MMR: "MM", THA: "TH", VNM: "VN",
  IDN: "ID", MYS: "MY", PHL: "PH", PRK: "KP",
  TWN: "TW", ARG: "AR", COL: "CO", VEN: "VE",
  CHL: "CL", PER: "PE", ETH: "ET", KEN: "KE",
  GHA: "GH", MAR: "MA", TUN: "TN", DZA: "DZ",
};

const CATEGORY_ORDER = [
  { key: "conflict", icon: "*", label: "CONFLICT" },
  { key: "politics", icon: "*", label: "POLITICS" },
  { key: "economy", icon: "*", label: "ECONOMY" },
  { key: "health", icon: "*", label: "HEALTH" },
  { key: "tech", icon: "*", label: "TECH" },
  { key: "sports", icon: "*", label: "SPORTS" },
  { key: "other", icon: "*", label: "OTHER" },
];

const CONFLICT_PRIORITY = new Set(["PSE", "UKR", "SYR", "IRQ", "AFG", "YEM", "SDN", "SOM", "MMR", "LBY"]);

function buildLines(news: NewsData): ZapLine[] {
  // Group all stories by category
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

  for (const { key, icon } of CATEGORY_ORDER) {
    const entries = byCat.get(key);
    if (!entries || entries.length === 0) continue;

    // Group by country within category
    const byCountry = new Map<string, ZapEntry[]>();
    for (const e of entries) {
      if (!byCountry.has(e.countryCode)) byCountry.set(e.countryCode, []);
      byCountry.get(e.countryCode)!.push(e);
    }

    // Sort countries: conflict-priority first, then alphabetically
    const sortedCodes = Array.from(byCountry.keys()).sort((a, b) => {
      const aPri = CONFLICT_PRIORITY.has(a) ? 0 : 1;
      const bPri = CONFLICT_PRIORITY.has(b) ? 0 : 1;
      if (aPri !== bPri) return aPri - bPri;
      const aName = byCountry.get(a)![0].country;
      const bName = byCountry.get(b)![0].country;
      return aName.localeCompare(bName);
    });

    lines.push({ type: "category", category: key, icon, count: entries.length });

    for (const code of sortedCodes) {
      const countryEntries = byCountry.get(code)!;
      const flag = FLAGS[code] || "";
      lines.push({ type: "country", name: countryEntries[0].country, flag });
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

  const [visibleCount, setVisibleCount] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);
  const ignoreScrollRef = useRef(false);

  const allDone = visibleCount >= totalLines;

  // Auto-reveal lines
  useEffect(() => {
    if (isPaused || allDone) return;
    const currentLine = lines[visibleCount];
    if (!currentLine) return;
    const delay = getBaseDelay(currentLine) * (SPEED_MULTIPLIERS[speed] ?? 1);
    const timer = setTimeout(() => {
      setVisibleCount((prev) => prev + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [visibleCount, isPaused, speed, allDone, lines]);

  // Auto-scroll to latest line
  useEffect(() => {
    if (userScrolledUp || !latestRef.current) return;
    ignoreScrollRef.current = true;
    latestRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    // Reset ignore flag after scroll finishes
    const t = setTimeout(() => { ignoreScrollRef.current = false; }, 400);
    return () => clearTimeout(t);
  }, [visibleCount, userScrolledUp]);

  // Detect manual scroll up → pause auto-scroll
  const handleScroll = useCallback(() => {
    if (ignoreScrollRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setUserScrolledUp(!isNearBottom);
  }, []);

  // Keyboard: space to toggle pause, Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.code === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const progress = totalLines > 0 ? (visibleCount / totalLines) * 100 : 0;
  const readingMinutes = Math.max(1, Math.round(totalStories * 0.1));

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-bg" style={{ isolation: "isolate" }}>
      {/* Progress bar */}
      <div className="h-1 w-full bg-surface-2 shrink-0">
        <div
          className="h-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="shrink-0 px-4 md:px-8 pt-5 pb-3 max-w-[720px] w-full mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-text-main text-xl flex items-center gap-2">
              ZAP ME
            </h2>
            <p className="text-text-dim text-xs font-mono mt-1">
              Catch up on {totalStories} stories in ~{readingMinutes} min
            </p>
            <p className="text-[10px] font-mono text-text-dim/60 mt-0.5">
              AI-generated summaries. Verify with original sources.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Speed controls */}
            {[1, 1.5, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded transition-colors ${
                  speed === s
                    ? "bg-accent text-bg font-bold"
                    : "bg-surface-2 text-text-dim hover:text-text-main"
                }`}
              >
                {s}x
              </button>
            ))}
            {/* Pause/Play */}
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="text-sm px-2.5 py-1 rounded bg-surface-2 text-text-dim hover:text-text-main transition-colors"
              title={isPaused ? "Play (Space)" : "Pause (Space)"}
            >
              {isPaused ? "▶" : "⏸"}
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              className="text-sm px-2.5 py-1 rounded bg-surface-2 text-text-dim hover:text-accent-2 transition-colors"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onClick={() => {
          if (window.innerWidth < 768) setIsPaused((p) => !p);
        }}
        className="flex-1 overflow-y-auto px-4 md:px-8 pb-20"
      >
        <div className="max-w-[720px] mx-auto space-y-1">
          {lines.slice(0, visibleCount).map((line, i) => {
            const isLatest = i === visibleCount - 1;
            return (
              <div
                key={i}
                ref={isLatest ? latestRef : undefined}
                className="zap-line-enter"
                style={{ animationDelay: "0ms" }}
              >
                {line.type === "category" && (
                  <div className="flex items-center gap-3 pt-6 pb-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[11px] font-mono uppercase tracking-widest text-text-dim">
                      {line.icon} {CATEGORY_ORDER.find((c) => c.key === line.category)?.label} ({line.count} {line.count === 1 ? "story" : "stories"})
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                {line.type === "country" && (
                  <div className="pt-3 pb-1">
                    <span className="font-heading font-semibold text-text-main text-sm">
                      {line.flag} {line.name}
                    </span>
                  </div>
                )}
                {line.type === "story" && (
                  <div
                    className={`pl-4 py-1 border-l-2 transition-colors duration-300 ${
                      isLatest && !allDone
                        ? "border-accent/70"
                        : "border-transparent"
                    }`}
                  >
                    <p className="text-[13px] md:text-[13px] text-[12px] font-mono text-text-dim leading-relaxed">
                      <span className="text-accent mr-1.5">►</span>
                      {line.headline}.{" "}
                      <span className="text-text-dim/60">({line.source})</span>
                    </p>
                    {line.summary && (
                      <p className="text-[12px] font-mono text-text-dim/50 leading-relaxed pl-4 mt-0.5">
                        {line.summary}
                        {line.link && (
                          <a
                            href={line.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-accent hover:text-accent/80 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Read more →
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* End message */}
          {allDone && (
            <div className="flex flex-col items-center justify-center pt-10 pb-6 zap-line-enter">
              <p className="font-heading font-bold text-text-main text-lg">
                You&apos;re all caught up!
              </p>
              <p className="text-text-dim text-xs font-mono mt-1">
                {totalStories} stories across {new Set(lines.filter((l) => l.type === "country").map(() => 1)).size > 0
                  ? lines.filter((l) => l.type === "country").length
                  : 0} countries
              </p>
              <button
                onClick={onClose}
                className="mt-4 border border-accent text-accent font-heading font-bold text-xs px-6 py-2 rounded hover:bg-accent hover:text-bg transition-colors uppercase tracking-wider"
              >
                Back to Map
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Paused indicator */}
      {isPaused && !allDone && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-2/90 border border-border rounded-full px-4 py-1.5 flex items-center gap-2 backdrop-blur">
          <span className="text-accent text-xs font-mono">PAUSED</span>
          <span className="text-text-dim text-[10px] font-mono hidden sm:inline">Press Space to resume</span>
        </div>
      )}
    </div>
  );
}
