"use client";

import { Sentiment } from "@/types/news";

const SENTIMENT_CONFIG: Record<Sentiment, { color: string; label: string }> = {
  positive: { color: "#34d399", label: "Positive" },
  negative: { color: "#ff3d71", label: "Negative" },
  neutral: { color: "#fbbf24", label: "Neutral" },
};

export function SentimentBadge({ sentiment }: { sentiment?: Sentiment }) {
  if (!sentiment) return null;
  const cfg = SENTIMENT_CONFIG[sentiment];
  return (
    <span
      className="font-data text-[10px] font-bold px-1.5 py-0.5 inline-flex items-center gap-1"
      style={{ backgroundColor: cfg.color + "22", color: cfg.color }}
    >
      <span className="sentiment-dot" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

export function SentimentLegend() {
  return (
    <div
      className="absolute bottom-3 left-3 z-40 px-3 py-2 flex items-center gap-3 backdrop-blur"
      style={{ background: "var(--surface)", opacity: 0.9, border: "1px solid var(--border)" }}
    >
      <span className="font-data text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--text-dim)" }}>Sentiment:</span>
      {(Object.entries(SENTIMENT_CONFIG) as [Sentiment, typeof SENTIMENT_CONFIG[Sentiment]][]).map(([key, cfg]) => (
        <span key={key} className="flex items-center gap-1 font-data text-[10px]" style={{ color: cfg.color }}>
          <span className="sentiment-dot" style={{ backgroundColor: cfg.color }} />
          {cfg.label}
        </span>
      ))}
    </div>
  );
}
