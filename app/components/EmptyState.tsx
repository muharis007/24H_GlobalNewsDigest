"use client";

const SOURCES = ["ARY News", "Geo TV", "Arab News", "BBC News"];

export default function EmptyState() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      <div
        className="backdrop-blur p-8 max-w-md text-center pointer-events-auto"
        style={{ background: "color-mix(in srgb, var(--surface) 90%, transparent)", border: "1px solid var(--border)" }}
      >
        <h2 className="font-display font-bold text-xl mb-2" style={{ color: "var(--text)" }}>
          Global News Intelligence
        </h2>
        <p className="font-serif-body text-sm mb-6" style={{ color: "var(--text-dim)" }}>
          Scanning the latest headlines and mapping them globally...
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {SOURCES.map((s) => (
            <span
              key={s}
              className="font-data text-[10px] px-3 py-1 uppercase tracking-[0.05em]"
              style={{ background: "var(--surface2)", color: "var(--text-dim)", border: "1px solid var(--border)" }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
