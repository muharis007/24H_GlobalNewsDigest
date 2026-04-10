"use client";

import { useState, useEffect } from "react";
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

const SOURCE_COLORS: Record<string, string> = {
  "ARY News": "#34d399",
  "Geo TV": "#60a5fa",
  "Arab News": "#fbbf24",
  "BBC": "#ff3d71",
  "BBC News": "#ff3d71",
};

const LANGUAGES = [
  { code: "ur", label: "Urdu" },
  { code: "ar", label: "Arabic" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "zh", label: "Chinese" },
];

interface StoryCardProps {
  story: Story;
  isLead?: boolean;
}

export default function StoryCard({ story, isLead }: StoryCardProps) {
  const badgeColor = CATEGORY_COLORS[story.category] || CATEGORY_COLORS.other;
  const sourceColor = SOURCE_COLORS[story.source] || "#94a3b8";
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (speaking) {
        speechSynthesis.cancel();
      }
    };
  }, [speaking]);

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
    <article
      className="py-3 hover:bg-[var(--surface2)]/30 transition-colors"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {/* Category tag */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="flex items-center gap-1">
          <span className="cat-dot" style={{ background: badgeColor }} />
          <span
            className="font-serif italic text-[11px] tracking-wide"
            style={{ color: badgeColor }}
          >
            {story.category.charAt(0).toUpperCase() + story.category.slice(1)}
          </span>
        </span>
        {story.breaking && (
          <span className="font-data text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider" style={{ color: "var(--accent2)", background: "var(--accent2)", backgroundColor: "rgba(193,18,31,0.15)" }}>
            Breaking
          </span>
        )}
        <SentimentBadge sentiment={story.sentiment} />
      </div>

      {/* Headline */}
      <h4
        className={`font-display font-bold leading-[1.15] mb-1.5 ${isLead ? "text-[20px]" : "text-[15px]"}`}
        style={{ color: "var(--text)" }}
      >
        {story.headline}
      </h4>

      {/* Summary */}
      <p className="font-serif-body text-[14px] leading-[1.6]" style={{ color: "var(--ink)" }}>
        {story.summary}
      </p>

      {/* Source attribution — right-aligned small caps */}
      <div className="flex items-center justify-end gap-2 mt-2">
        <span className="source-dot" style={{ background: sourceColor }} />
        <span className="font-data text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--text-dim)" }}>
          {story.source}
        </span>
        {story.link && (
          <>
            <span style={{ color: "var(--border)" }}>|</span>
            <a
              href={story.link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-data text-[10px] uppercase tracking-[0.05em] hover:opacity-70 transition-opacity"
              style={{ color: "var(--accent)" }}
            >
              Read more
            </a>
          </>
        )}
      </div>

      {/* Actions row */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <button
          onClick={async () => {
            const text = `${story.headline}\n${story.summary}${story.link ? `\n${story.link}` : ""}\n\n(AI-generated summary via NewsGlobe)`;
            if (navigator.share) {
              try { await navigator.share({ title: story.headline, text }); } catch {}
            } else {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
          className="font-data text-[10px] hover:opacity-70 transition-opacity uppercase tracking-wider"
          style={{ color: "var(--text-dim)" }}
        >
          {copied ? "Copied" : "Share"}
        </button>
        <span style={{ color: "var(--border)" }}>|</span>
        <button
          onClick={() => {
            if (speaking) {
              speechSynthesis.cancel();
              setSpeaking(false);
            } else {
              const utter = new SpeechSynthesisUtterance(`${story.headline}. ${story.summary}. Note: this is an AI-generated summary.`);
              utter.rate = 0.9;
              utter.onend = () => setSpeaking(false);
              utter.onerror = () => setSpeaking(false);
              setSpeaking(true);
              speechSynthesis.speak(utter);
            }
          }}
          className="font-data text-[10px] hover:opacity-70 transition-opacity uppercase tracking-wider"
          style={{ color: "var(--text-dim)" }}
        >
          {speaking ? "Stop" : "Listen"}
        </button>
        <span style={{ color: "var(--border)" }}>|</span>
        <span className="font-data text-[10px] uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Translate:</span>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleTranslate(lang.code)}
            disabled={translating}
            className="font-data text-[10px] hover:opacity-70 uppercase tracking-wider transition-opacity disabled:opacity-30"
            style={{ color: "var(--text-dim)" }}
          >
            {lang.label}
          </button>
        ))}
      </div>
      {translating && (
        <p className="font-data text-[10px] animate-pulse mt-1" style={{ color: "var(--text-dim)" }}>Translating...</p>
      )}
      {translated && (
        <div className="mt-2 p-2 rounded" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
          <p className="font-serif-body text-[13px] leading-relaxed" style={{ color: "var(--text)" }}>{translated}</p>
          <button
            onClick={() => setTranslated(null)}
            className="font-data text-[10px] mt-1 hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-dim)" }}
          >
            Close
          </button>
        </div>
      )}
    </article>
  );
}
