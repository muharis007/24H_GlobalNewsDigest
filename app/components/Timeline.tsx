"use client";

import { useState, useEffect } from "react";

interface TimelineEntry {
  timestamp: number;
  countries: number;
  stories: number;
}

interface TimelineProps {
  onClose: () => void;
}

export default function Timeline({ onClose }: TimelineProps) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/timeline")
      .then((r) => r.json())
      .then((d) => setEntries(d.snapshots ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-[9998] bg-bg/95 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-text-main text-xl">📅 News Timeline</h2>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-accent-2 text-sm font-mono transition-colors"
          >
            ✕ Close
          </button>
        </div>

        {loading ? (
          <p className="text-text-dim font-mono text-sm text-center">Loading snapshots...</p>
        ) : entries.length === 0 ? (
          <p className="text-text-dim font-mono text-sm text-center">
            No historical snapshots yet. Data is captured every time news is fetched.
          </p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {entries.map((entry, i) => {
                const date = new Date(entry.timestamp);
                const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
                const isLatest = i === entries.length - 1;

                return (
                  <div key={entry.timestamp} className="flex items-start gap-4 pl-1">
                    <div
                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10"
                      style={{
                        borderColor: isLatest ? "#00e5ff" : "#1e293b",
                        backgroundColor: isLatest ? "#00e5ff22" : "#111827",
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: isLatest ? "#00e5ff" : "#64748b" }}
                      />
                    </div>
                    <div
                      className={`flex-1 bg-surface-2 border rounded-lg p-3 ${
                        isLatest ? "border-accent/30" : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-text-main font-bold">{timeStr}</span>
                        <span className="text-[10px] font-mono text-text-dim">{dateStr}</span>
                        {isLatest && (
                          <span className="text-[10px] font-mono bg-accent/10 text-accent px-2 py-0.5 rounded">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-accent">{entry.stories} stories</span>
                        <span className="text-xs font-mono text-text-dim">{entry.countries} countries</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
