"use client";

const SOURCES = ["ARY News", "Geo TV", "Arab News", "BBC News"];

export default function EmptyState() {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      <div className="bg-surface/90 backdrop-blur border border-border rounded-xl p-8 max-w-md text-center pointer-events-auto">
        <div className="text-5xl mb-4"></div>
        <h2 className="font-heading font-bold text-text-main text-xl mb-2">
          Global News Intelligence
        </h2>
        <p className="text-text-dim text-sm mb-6 font-mono">
          Scanning the latest headlines and mapping them globally...
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {SOURCES.map((s) => (
            <span
              key={s}
              className="text-[10px] font-mono bg-surface-2 text-text-dim px-3 py-1 rounded-full border border-border"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
