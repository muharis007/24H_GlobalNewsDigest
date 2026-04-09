"use client";

import { Sentiment } from "@/types/news";

const SENTIMENT_CONFIG: Record<Sentiment, { icon: string; color: string; label: string }> = {
  positive: { icon: "↑", color: "#34d399", label: "Positive" },
  negative: { icon: "↓", color: "#ff3d71", label: "Negative" },
  neutral: { icon: "→", color: "#fbbf24", label: "Neutral" },
};

export function SentimentBadge({ sentiment }: { sentiment?: Sentiment }) {
  if (!sentiment) return null;
  const cfg = SENTIMENT_CONFIG[sentiment];
  return (
    <span
      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
      style={{ backgroundColor: cfg.color + "22", color: cfg.color }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

export function SentimentLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-40 bg-surface/90 border border-border rounded-lg px-3 py-2 flex items-center gap-3">
      <span className="text-[10px] font-mono text-text-dim">Sentiment:</span>
      {(Object.entries(SENTIMENT_CONFIG) as [Sentiment, typeof SENTIMENT_CONFIG[Sentiment]][]).map(([key, cfg]) => (
        <span key={key} className="flex items-center gap-1 text-[10px] font-mono" style={{ color: cfg.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
          {cfg.label}
        </span>
      ))}
    </div>
  );
}
