"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import LoadingOverlay from "./components/LoadingOverlay";
import ErrorBanner from "./components/ErrorBanner";

import ZapMe from "./components/ZapMe";
import SearchFilter, { FilterState } from "./components/SearchFilter";
import NewsTicker from "./components/NewsTicker";
import { SentimentLegend } from "./components/SentimentBadge";
import Timeline from "./components/Timeline";
import TrendPanel from "./components/TrendPanel";
import Preferences, { UserPrefs, loadPrefs } from "./components/Preferences";
import NewsChat from "./components/NewsChat";
import { NewsData } from "@/types/news";

const Map = dynamic(() => import("./components/Map"), { ssr: false });

export default function Home() {
  const [data, setData] = useState<NewsData | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("newsglobe-data");
      const ts = localStorage.getItem("newsglobe-data-ts");
      if (stored && ts) {
        const age = Date.now() - parseInt(ts, 10);
        if (age > 48 * 60 * 60 * 1000) {
          localStorage.removeItem("newsglobe-data");
          localStorage.removeItem("newsglobe-data-ts");
          return null;
        }
        return JSON.parse(stored);
      }
      return null;
    } catch {
      return null;
    }
  });
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchStartedAt, setFetchStartedAt] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showZap, setShowZap] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [prefs, setPrefs] = useState<UserPrefs>({ favoriteCategories: [], favoriteCountries: [] });
  const [liveStatus, setLiveStatus] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);
  const [filter, setFilter] = useState<FilterState>({ query: "", category: "all" });
  const [mapMode, setMapMode] = useState<"default" | "heatmap" | "sentiment">("default");

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLiveStatus("Fetching RSS feeds...");
    setFetchStartedAt(Date.now());

    try {
      // Phase 1: Fetch RSS items (fast)
      const rssRes = await fetch("/api/rss");
      const rssData = await rssRes.json();

      if (rssData.error || !rssData.items || rssData.items.length === 0) {
        // Try cached data
        const cached = await fetch("/api/news/cached");
        if (cached.ok) {
          const cachedData = await cached.json();
          if (cachedData.countries?.length > 0) {
            setData(cachedData);
            try { localStorage.setItem("newsglobe-data", JSON.stringify(cachedData)); localStorage.setItem("newsglobe-data-ts", String(Date.now())); } catch {}
            setError("Could not reach news sources. Showing cached data.");
          } else {
            setError("Could not reach news sources. Check your connection.");
          }
        } else {
          setError("Could not reach news sources. Check your connection.");
        }
        return;
      }

      setLiveStatus(`Got ${rssData.count} headlines. Summarizing with AI...`);

      // Phase 2: Summarize with Gemini (slower)
      const summaryRes = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headlines: rssData.items }),
      });
      const newsResult = await summaryRes.json();

      if (newsResult.error && !newsResult.countries?.length) {
        // Complete failure — try cached
        const cached = await fetch("/api/news/cached");
        if (cached.ok) {
          const cachedData = await cached.json();
          if (cachedData.countries?.length > 0) {
            setData(cachedData);
            try { localStorage.setItem("newsglobe-data", JSON.stringify(cachedData)); localStorage.setItem("newsglobe-data-ts", String(Date.now())); } catch {}
          }
        }
        setError(newsResult.error);
        return;
      }

      if (newsResult.error) {
        setError(newsResult.error);
      }

      if (newsResult.countries?.length > 0) {
        setData(newsResult);
        try { localStorage.setItem("newsglobe-data", JSON.stringify(newsResult)); localStorage.setItem("newsglobe-data-ts", String(Date.now())); } catch {}
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      // Try to load from cache on any error
      try {
        const cached = await fetch("/api/news/cached");
        if (cached.ok) {
          const cachedData = await cached.json();
          if (cachedData.countries?.length > 0) {
            setData(cachedData);
            try { localStorage.setItem("newsglobe-data", JSON.stringify(cachedData)); localStorage.setItem("newsglobe-data-ts", String(Date.now())); } catch {}
          }
        }
      } catch {}
      setError(msg);
    } finally {
      setLoading(false);
      setLiveStatus(null);
      setFetchStartedAt(null);
    }
  }, []);

  // Auto-fetch on mount and every 6 hours
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    fetchNews();
    intervalRef.current = setInterval(() => {
      fetchNews();
    }, 6 * 60 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNews]);

  const handleSelectCountry = useCallback((code: string | null) => {
    setSelectedCountry(code);
    if (code) setSidebarOpen(true);
  }, []);

  const storyCount = data?.countries.reduce((sum, c) => sum + c.stories.length, 0) ?? 0;
  const countryCount = data?.countries.length ?? 0;

  // Filter data based on search + category
  const filteredCountries = (data?.countries ?? [])
    .map((c) => {
      const stories = c.stories.filter((s) => {
        if (filter.category !== "all" && s.category !== filter.category) return false;
        if (filter.query) {
          const q = filter.query.toLowerCase();
          return s.headline.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q);
        }
        return true;
      });
      return { ...c, stories };
    })
    .filter((c) => c.stories.length > 0);

  return (
    <div className="flex flex-col h-screen bg-bg text-text-main overflow-hidden">
      <Header
        updatedAt={data?.updated_at ?? null}
        storyCount={storyCount}
        countryCount={countryCount}
        loading={loading}
        hasNews={!!data && data.countries.length > 0}
        onZap={() => setShowZap(true)}
        onTimeline={() => setShowTimeline(true)}
        onTrends={() => setShowTrends(true)}
        onPrefs={() => setShowPrefs(true)}
      />

      {/* AI Disclaimer */}
      <div className="bg-surface-2 border-b border-border px-4 py-1.5 text-center shrink-0">
        <p className="text-[11px] font-mono text-text-dim">
          Content is generated using AI and may contain inaccuracies. Verify important information with original sources.
        </p>
      </div>

      {/* Error Banner */}
      {error && !loading && (
        <ErrorBanner
          type={error.includes("cached") || error.includes("quota") ? "warning" : "error"}
          message={error}
          dismissible
          onDismiss={() => setError(null)}
        />
      )}

      {/* Breaking News Ticker */}
      {data && <NewsTicker countries={data.countries} />}

      {/* Search & Filter */}
      {data && data.countries.length > 0 && (
        <SearchFilter filter={filter} onChange={setFilter} />
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Map area */}
        <div className="flex-1 relative">
          <Map
            countries={filteredCountries}
            selectedCountry={selectedCountry}
            onSelectCountry={(code) => handleSelectCountry(code)}
            heatmapMode={mapMode === "heatmap"}
            sentimentMode={mapMode === "sentiment"}
          />

          {/* Map mode toggles */}
          {data && data.countries.length > 0 && (
            <div className="absolute top-3 left-3 z-40 flex gap-1">
              {(["default", "heatmap", "sentiment"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setMapMode(mode)}
                  className={`text-[10px] md:text-[10px] font-mono px-3 py-2 md:px-2.5 md:py-1 rounded transition-colors min-h-[36px] md:min-h-0 ${
                    mapMode === mode
                      ? "bg-accent text-bg font-bold"
                      : "bg-surface/90 text-text-dim hover:text-text-main border border-border"
                  }`}
                >
                  {mode === "default" ? "Default" : mode === "heatmap" ? "Heatmap" : "Sentiment"}
                </button>
              ))}
            </div>
          )}

          {/* Sentiment legend */}
          {mapMode === "sentiment" && data && <SentimentLegend />}

          {loading && <LoadingOverlay status={liveStatus} startedAt={fetchStartedAt ?? undefined} />}

          {/* Mobile sidebar toggle */}
          {data && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden absolute bottom-4 right-4 z-40 bg-accent text-bg font-heading font-bold text-xs px-5 py-3 rounded-full shadow-lg min-h-[44px]"
            >
              {sidebarOpen ? "Hide" : `${countryCount} Countries`}
            </button>
          )}

        </div>

        {/* Sidebar */}
        <div
          className={`
            ${sidebarOpen ? "translate-y-0" : "translate-y-full"}
            lg:translate-y-0
            fixed lg:static bottom-0 left-0 right-0 lg:bottom-auto
            h-[70vh] lg:h-auto
            w-full lg:w-[340px]
            z-50 lg:z-auto
            transition-transform duration-300 ease-in-out
            shrink-0
            rounded-t-2xl lg:rounded-none
          `}
        >
          {/* Mobile grab handle */}
          <div className="lg:hidden flex flex-col items-center pt-2 pb-1 bg-surface rounded-t-2xl border-t border-x border-border">
            <div className="grab-handle" />
            <span className="text-[10px] font-mono text-text-dim mt-1">Swipe or tap to dismiss</span>
          </div>
          <Sidebar
            countries={filteredCountries}
            selectedCountry={selectedCountry}
            onSelectCountry={handleSelectCountry}
            favoriteCountries={prefs.favoriteCountries}
          />
        </div>
      </div>

      {/* Footer credit */}
      <div className="bg-surface-2 border-t border-border px-4 py-1.5 text-center shrink-0">
        <p className="text-[11px] font-mono text-text-dim">Designed & Built by <span className="text-accent">Muhammad Haris</span></p>
      </div>

      {/* Zap Me overlay */}
      {showZap && (
        data ? (
          <ZapMe news={data} onClose={() => setShowZap(false)} />
        ) : (
          <div className="fixed inset-0 z-[9998] bg-bg/95 flex items-center justify-center">
            <div className="text-center">
              <p className="text-text-dim font-mono text-sm mb-4">No news data available. Fetch news first.</p>
              <button onClick={() => setShowZap(false)} className="text-accent font-mono text-sm hover:text-accent/80">Close</button>
            </div>
          </div>
        )
      )}
      {/* Timeline overlay */}
      {showTimeline && (
        <Timeline onClose={() => setShowTimeline(false)} />
      )}
      {/* Trends overlay */}
      {showTrends && (
        data ? (
          <TrendPanel countries={data.countries} onClose={() => setShowTrends(false)} />
        ) : (
          <div className="fixed inset-0 z-[9998] bg-bg/95 flex items-center justify-center">
            <div className="text-center">
              <p className="text-text-dim font-mono text-sm mb-4">No news data available. Fetch news first.</p>
              <button onClick={() => setShowTrends(false)} className="text-accent font-mono text-sm hover:text-accent/80">Close</button>
            </div>
          </div>
        )
      )}
      {/* Preferences overlay */}
      {showPrefs && (
        <Preferences
          availableCountries={(data?.countries ?? []).map((c) => c.name).sort()}
          onClose={() => setShowPrefs(false)}
          onSave={setPrefs}
        />
      )}
      {/* Chat overlay */}
      {showChat && (
        data ? (
          <NewsChat news={data} onClose={() => setShowChat(false)} />
        ) : (
          <div className="fixed inset-0 z-[9998] bg-bg/95 flex items-center justify-center">
            <div className="text-center">
              <p className="text-text-dim font-mono text-sm mb-4">No news data available. Fetch news first.</p>
              <button onClick={() => setShowChat(false)} className="text-accent font-mono text-sm hover:text-accent/80">Close</button>
            </div>
          </div>
        )
      )}
      {/* Floating chat button */}
      {data && data.countries.length > 0 && !showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 z-[9000] w-12 h-12 md:w-12 md:h-12 bg-accent text-bg rounded-full shadow-lg flex items-center justify-center text-sm md:text-xl hover:bg-accent/80 transition-colors"
          title="Ask the News"
        >
          Chat
        </button>
      )}
    </div>
  );
}
