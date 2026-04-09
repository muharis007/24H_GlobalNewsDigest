"use client";

import { Category } from "@/types/news";

const CATEGORIES: { key: Category | "all"; label: string; color: string }[] = [
  { key: "all", label: "All", color: "#00e5ff" },
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
    <div className="flex items-center gap-2 px-4 py-2 bg-surface border-b border-border shrink-0 overflow-x-auto">
      {/* Search input */}
      <div className="relative shrink-0">
        <input
          type="text"
          placeholder="Search headlines..."
          value={filter.query}
          onChange={(e) => onChange({ ...filter, query: e.target.value })}
          className="bg-surface-2 border border-border text-text-main text-xs font-mono rounded px-3 py-1.5 pl-7 w-48 focus:outline-none focus:border-accent/50 placeholder:text-text-dim"
        />
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim text-xs">🔍</span>
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-1">
        {CATEGORIES.map((cat) => {
          const active = filter.category === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onChange({ ...filter, category: cat.key })}
              className="text-[10px] font-mono px-2.5 py-1 rounded-full transition-colors whitespace-nowrap"
              style={{
                backgroundColor: active ? cat.color + "33" : "transparent",
                color: active ? cat.color : "#64748b",
                border: `1px solid ${active ? cat.color + "55" : "transparent"}`,
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
