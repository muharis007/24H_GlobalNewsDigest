"use client";

import { Category } from "@/types/news";

const CATEGORIES: { key: Category | "all"; label: string; color: string }[] = [
  { key: "all", label: "All", color: "var(--accent)" },
  { key: "conflict", label: "Conflict", color: "#ff3d71" },
  { key: "politics", label: "Politics", color: "#fbbf24" },
  { key: "economy", label: "Economy", color: "#34d399" },
  { key: "sports", label: "Sports", color: "#60a5fa" },
  { key: "tech", label: "Tech", color: "#a78bfa" },
  { key: "health", label: "Health", color: "#f472b6" },
  { key: "other", label: "Other", color: "#94a3b8" },
];

export interface FilterState {
  query: string;
  category: Category | "all";
}

interface SearchFilterProps {
  filter: FilterState;
  onChange: (filter: FilterState) => void;
}

export default function SearchFilter({ filter, onChange }: SearchFilterProps) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 shrink-0 overflow-x-auto"
      style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
    >
      {/* Search input */}
      <div className="relative shrink-0">
        <input
          type="text"
          placeholder="Search headlines..."
          value={filter.query}
          onChange={(e) => onChange({ ...filter, query: e.target.value })}
          className="font-serif-body text-xs px-3 py-1.5 w-48 focus:outline-none"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />
      </div>

      {/* Category pills with colored dots */}
      <div className="flex items-center gap-1">
        {CATEGORIES.map((cat) => {
          const active = filter.category === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onChange({ ...filter, category: cat.key })}
              className="flex items-center gap-1.5 font-data text-[10px] px-2.5 py-1 transition-colors whitespace-nowrap uppercase tracking-[0.05em]"
              style={{
                backgroundColor: active ? "color-mix(in srgb, " + cat.color + " 20%, transparent)" : "transparent",
                color: active ? cat.color : "var(--text-dim)",
                border: active ? "1px solid color-mix(in srgb, " + cat.color + " 35%, transparent)" : "1px solid transparent",
              }}
            >
              {cat.key !== "all" && <span className="cat-dot" style={{ background: cat.color }} />}
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
