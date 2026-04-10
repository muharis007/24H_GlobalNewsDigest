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
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-start md:justify-center p-4 md:p-8 overflow-y-auto"
      style={{ background: "color-mix(in srgb, var(--bg) 95%, transparent)" }}
    >
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl" style={{ color: "var(--text)" }}>News Timeline</h2>
          <button
            onClick={onClose}
            className="font-data text-sm hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-dim)" }}
          >
            Close
          </button>
        </div>

        {loading ? (
          <p className="font-serif-body text-sm text-center" style={{ color: "var(--text-dim)" }}>Loading snapshots...</p>
        ) : entries.length === 0 ? (
          <p className="font-serif-body text-sm text-center" style={{ color: "var(--text-dim)" }}>
            No historical snapshots yet. Data is captured every time news is fetched.
          </p>
        ) : (
          <div className="relative">
            {/* Vertical rule */}
            <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: "var(--border)" }} />

            <div className="space-y-4">
              {entries.map((entry, i) => {
                const date = new Date(entry.timestamp);
                const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
                const isLatest = i === entries.length - 1;

                return (
                  <div key={entry.timestamp} className="flex items-start gap-4 pl-1">
                    <div
                      className="w-7 h-7 flex items-center justify-center shrink-0 z-10"
                      style={{
                        border: `2px solid ${isLatest ? "var(--accent)" : "var(--border)"}`,
                        backgroundColor: isLatest ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--surface)",
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: isLatest ? "var(--accent)" : "var(--text-dim)" }}
                      />
                    </div>
                    <div
                      className="flex-1 p-3"
                      style={{
                        background: "var(--surface2)",
                        border: `1px solid ${isLatest ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "var(--border)"}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-data text-xs font-bold" style={{ color: "var(--text)" }}>{timeStr}</span>
                        <span className="font-data text-[10px]" style={{ color: "var(--text-dim)" }}>{dateStr}</span>
                        {isLatest && (
                          <span
                            className="font-data text-[10px] px-2 py-0.5 uppercase tracking-[0.1em]"
                            style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)", color: "var(--accent)" }}
                          >
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-data text-xs" style={{ color: "var(--accent)" }}>{entry.stories} stories</span>
                        <span className="font-data text-xs" style={{ color: "var(--text-dim)" }}>{entry.countries} countries</span>
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
