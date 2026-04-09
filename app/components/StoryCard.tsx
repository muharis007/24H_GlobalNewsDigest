"use client";

import { Story } from "@/types/news";

const CATEGORY_COLORS: Record<string, string> = {
  conflict: "#ff3d71",
  politics: "#fbbf24",
  economy: "#34d399",
  sports: "#60a5fa",
  tech: "#a78bfa",
  health: "#f472b6",
  other: "#94a3b8",
};

interface StoryCardProps {
  story: Story;
}

export default function StoryCard({ story }: StoryCardProps) {
  const badgeColor = CATEGORY_COLORS[story.category] || CATEGORY_COLORS.other;

  return (
    <div className="p-3 rounded-lg bg-surface-2 border border-border hover:border-accent/30 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: badgeColor + "22", color: badgeColor }}
        >
          {story.category}
        </span>
        <span className="text-[10px] text-text-dim font-mono">{story.source}</span>
      </div>
      <h4 className="text-sm font-heading font-semibold text-text-main leading-tight mb-1">
        {story.headline}
      </h4>
      <p className="text-xs text-text-dim leading-relaxed">{story.summary}</p>
      {story.link && (
        <a
          href={story.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-[11px] font-mono text-accent hover:text-accent/80 transition-colors"
        >
          Read more →
        </a>
      )}
    </div>
  );
}
