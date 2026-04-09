"use client";

import { useState } from "react";
import { Story } from "@/types/news";
import { SentimentBadge } from "./SentimentBadge";

const CATEGORY_COLORS: Record<string, string> = {
  conflict: "#ff3d71",
  politics: "#fbbf24",
  economy: "#34d399",
  sports: "#60a5fa",
  tech: "#a78bfa",
  health: "#f472b6",
  other: "#94a3b8",
};

const LANGUAGES = [
  { code: "ur", label: "اردو" },
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" },
];

interface StoryCardProps {
  story: Story;
}

export default function StoryCard({ story }: StoryCardProps) {
  const badgeColor = CATEGORY_COLORS[story.category] || CATEGORY_COLORS.other;
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleTranslate = async (lang: string) => {
    setTranslating(true);
    setTranslated(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${story.headline}\n${story.summary}`,
          targetLang: lang,
        }),
      });
      const data = await res.json();
      setTranslated(data.translated || data.error || "Translation failed");
    } catch {
      setTranslated("Translation failed");
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="p-3 rounded-lg bg-surface-2 border border-border hover:border-accent/30 transition-colors">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: badgeColor + "22", color: badgeColor }}
        >
          {story.category}
        </span>
        {story.breaking && (
          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-accent-2/20 text-accent-2">
            Breaking
          </span>
        )}
        <SentimentBadge sentiment={story.sentiment} />
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
      {/* Share & Translate row */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <button
          onClick={async () => {
            const text = `${story.headline}\n${story.summary}${story.link ? `\n${story.link}` : ""}`;
            if (navigator.share) {
              try { await navigator.share({ title: story.headline, text }); } catch {}
            } else {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
          className="text-[10px] font-mono text-text-dim hover:text-accent transition-colors"
        >
          {copied ? "✓ Copied" : "📤 Share"}
        </button>
        <span className="text-border">|</span>
        <button
          onClick={() => {
            if (speaking) {
              speechSynthesis.cancel();
              setSpeaking(false);
            } else {
              const utter = new SpeechSynthesisUtterance(`${story.headline}. ${story.summary}`);
              utter.rate = 0.9;
              utter.onend = () => setSpeaking(false);
              utter.onerror = () => setSpeaking(false);
              setSpeaking(true);
              speechSynthesis.speak(utter);
            }
          }}
          className="text-[10px] font-mono text-text-dim hover:text-accent transition-colors"
        >
          {speaking ? "⏹ Stop" : "🔊 Listen"}
        </button>
        <span className="text-border">|</span>
        <span className="text-[10px] text-text-dim font-mono">🌐</span>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleTranslate(lang.code)}
            disabled={translating}
            className="text-[10px] font-mono text-text-dim hover:text-accent transition-colors disabled:opacity-30"
          >
            {lang.label}
          </button>
        ))}
      </div>
      {translating && (
        <p className="text-[10px] font-mono text-text-dim animate-pulse mt-1">Translating...</p>
      )}
      {translated && (
        <div className="mt-2 p-2 bg-bg rounded border border-border">
          <p className="text-xs text-text-main leading-relaxed">{translated}</p>
          <button
            onClick={() => setTranslated(null)}
            className="text-[10px] font-mono text-text-dim hover:text-accent-2 mt-1"
          >
            ✕ Hide
          </button>
        </div>
      )}
    </div>
  );
}
