"use client";

interface HeaderProps {
  updatedAt: string | null;
  storyCount: number;
  countryCount: number;
  loading: boolean;
  hasNews: boolean;
  onZap: () => void;
  onTimeline: () => void;
  onTrends: () => void;
  onPrefs: () => void;
}

export default function Header({ updatedAt, storyCount, countryCount, loading, hasNews, onZap, onTimeline, onTrends, onPrefs }: HeaderProps) {
  const formattedTime = updatedAt
    ? new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const disabledClass = !hasNews
    ? "opacity-[0.35] cursor-not-allowed pointer-events-none"
    : "";

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0 z-50">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
        <span className="font-heading font-bold text-text-main text-lg tracking-tight">
          NEWSGLOBE
        </span>
        <span className="text-[10px] font-mono bg-accent/10 text-accent px-2 py-0.5 rounded uppercase tracking-widest hidden sm:inline">
          24H Digest
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-4">
        {formattedTime && (
          <span className="text-xs font-mono text-text-dim hidden sm:block">
            Updated {formattedTime}
          </span>
        )}
        {storyCount > 0 && (
          <>
            <span className="text-xs font-mono text-accent hidden sm:block">
              {storyCount} stories
            </span>
            <span className="text-xs font-mono text-text-dim hidden md:block">
              {countryCount} countries
            </span>
          </>
        )}
        {loading && (
          <span className="text-[10px] font-mono text-accent animate-pulse">Scanning...</span>
        )}
        <button
          onClick={onPrefs}
          disabled={!hasNews}
          className={`border border-border text-text-dim font-heading font-bold text-xs px-3 py-1.5 rounded hover:bg-surface-2 hover:text-text-main transition-colors uppercase tracking-wider hidden md:inline-flex ${disabledClass}`}
        >
          Settings
        </button>
        <button
          onClick={onTrends}
          disabled={!hasNews}
          className={`border border-border text-text-dim font-heading font-bold text-xs px-3 py-1.5 rounded hover:bg-surface-2 hover:text-text-main transition-colors uppercase tracking-wider hidden md:inline-flex ${disabledClass}`}
        >
          Trends
        </button>
        <button
          onClick={onTimeline}
          disabled={!hasNews}
          className={`border border-border text-text-dim font-heading font-bold text-xs px-3 py-1.5 rounded hover:bg-surface-2 hover:text-text-main transition-colors uppercase tracking-wider hidden md:inline-flex ${disabledClass}`}
        >
          Timeline
        </button>
        <button
          onClick={onZap}
          disabled={!hasNews}
          className={`border border-accent text-accent font-heading font-bold text-xs px-4 py-1.5 rounded hover:bg-accent hover:text-bg transition-colors uppercase tracking-wider hidden md:inline-flex ${!hasNews ? "opacity-[0.35] cursor-not-allowed pointer-events-none" : ""}`}
        >
          Zap Me
        </button>
        {/* Mobile menu button */}
        <button
          onClick={() => {
            const el = document.getElementById("mobile-header-menu");
            if (el) el.classList.toggle("hidden");
          }}
          className="md:hidden border border-border text-text-dim font-heading font-bold text-xs px-2.5 py-1.5 rounded hover:bg-surface-2 hover:text-text-main transition-colors"
        >
          Menu
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <div id="mobile-header-menu" className="hidden md:hidden absolute top-14 right-0 left-0 bg-surface border-b border-border z-50 p-3 flex flex-col gap-2">
        <button
          onClick={() => { onPrefs(); document.getElementById("mobile-header-menu")?.classList.add("hidden"); }}
          disabled={!hasNews}
          className={`w-full text-left border border-border text-text-dim font-heading font-bold text-xs px-3 py-2 rounded hover:bg-surface-2 hover:text-text-main transition-colors uppercase tracking-wider ${disabledClass}`}
        >
          Settings
        </button>
        <button
          onClick={() => { onTrends(); document.getElementById("mobile-header-menu")?.classList.add("hidden"); }}
          disabled={!hasNews}
          className={`w-full text-left border border-border text-text-dim font-heading font-bold text-xs px-3 py-2 rounded hover:bg-surface-2 hover:text-text-main transition-colors uppercase tracking-wider ${disabledClass}`}
        >
          Trends
        </button>
        <button
          onClick={() => { onTimeline(); document.getElementById("mobile-header-menu")?.classList.add("hidden"); }}
          disabled={!hasNews}
          className={`w-full text-left border border-border text-text-dim font-heading font-bold text-xs px-3 py-2 rounded hover:bg-surface-2 hover:text-text-main transition-colors uppercase tracking-wider ${disabledClass}`}
        >
          Timeline
        </button>
        <button
          onClick={() => { onZap(); document.getElementById("mobile-header-menu")?.classList.add("hidden"); }}
          disabled={!hasNews}
          className={`w-full text-left border border-accent text-accent font-heading font-bold text-xs px-3 py-2 rounded hover:bg-accent hover:text-bg transition-colors uppercase tracking-wider ${!hasNews ? "opacity-[0.35] cursor-not-allowed pointer-events-none" : ""}`}
        >
          Zap Me
        </button>
      </div>
    </header>
  );
}
