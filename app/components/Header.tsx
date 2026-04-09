"use client";

interface HeaderProps {
  updatedAt: string | null;
  storyCount: number;
  countryCount: number;
  loading: boolean;
  hasNews: boolean;
  onZap: () => void;
}

export default function Header({ updatedAt, storyCount, countryCount, loading, hasNews, onZap }: HeaderProps) {
  const formattedTime = updatedAt
    ? new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

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
        <span className="text-[10px] font-mono bg-accent/10 text-accent px-2 py-0.5 rounded uppercase tracking-widest">
          24H Digest
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
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
        <button
          onClick={onZap}
          disabled={!hasNews}
          className="border border-accent text-accent font-heading font-bold text-xs px-4 py-1.5 rounded hover:bg-accent hover:text-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-accent uppercase tracking-wider"
        >
          ⚡ Zap Me
        </button>
        {loading && (
          <span className="text-[10px] font-mono text-accent animate-pulse">Scanning...</span>
        )}
      </div>
    </header>
  );
}
