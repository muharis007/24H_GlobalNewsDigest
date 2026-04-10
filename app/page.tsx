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
      const rssRes = await fetch("/api/rss");
      const rssData = await rssRes.json();

      if (rssData.error || !rssData.items || rssData.items.length === 0) {
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

      const summaryRes = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headlines: rssData.items }),
      });
      const newsResult = await summaryRes.json();

      if (newsResult.error && !newsResult.countries?.length) {
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

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // Only fetch if cached data is older than 6 hours (or missing)
    const ts = localStorage.getItem("newsglobe-data-ts");
    const age = ts ? Date.now() - parseInt(ts, 10) : Infinity;
    const SIX_HOURS = 6 * 60 * 60 * 1000;

    if (age >= SIX_HOURS) {
      fetchNews();
    }

    // Schedule next fetch based on remaining time
    const firstDelay = age < SIX_HOURS ? SIX_HOURS - age : SIX_HOURS;
    const firstTimer = setTimeout(() => {
      fetchNews();
      intervalRef.current = setInterval(() => {
        fetchNews();
      }, SIX_HOURS);
    }, firstDelay);

    return () => {
      clearTimeout(firstTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNews]);

  const handleSelectCountry = useCallback((code: string | null) => {
    setSelectedCountry(code);
    if (code) setSidebarOpen(true);
  }, []);

  const storyCount = data?.countries.reduce((sum, c) => sum + c.stories.length, 0) ?? 0;
  const countryCount = data?.countries.length ?? 0;

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
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
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
      <div className="px-4 py-1.5 text-center shrink-0" style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
        <p className="font-data text-[9px] uppercase tracking-[0.1em]" style={{ color: "var(--text-dim)" }}>
          Content is generated using AI and may contain inaccuracies -- Verify important information with original sources.
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
        {/* Map area with newspaper frame */}
        <div className="flex-1 relative">
          {/* Map title overlay */}
          <div className="absolute top-0 left-0 right-0 z-30 text-center pointer-events-none py-2">
            <span className="font-data text-[9px] uppercase tracking-[0.2em] px-3 py-1" style={{ background: "rgba(10,14,23,0.7)", color: "#64748b" }}>
              Global Coverage Map
            </span>
          </div>
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
                  className="font-data text-[10px] px-3 py-2 md:px-2.5 md:py-1 transition-colors min-h-[36px] md:min-h-0"
                  style={
                    mapMode === mode
                      ? { background: "var(--accent)", color: "var(--bg)", fontWeight: "bold" }
                      : { background: "rgba(17,24,39,0.9)", color: "#94a3b8", border: "1px solid #1e293b" }
                  }
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
              className="lg:hidden absolute bottom-4 right-4 z-40 font-display font-bold text-xs px-5 py-3 shadow-lg min-h-[44px]"
              style={{ background: "var(--accent)", color: "var(--bg)" }}
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
          `}
        >
          {/* Mobile grab handle */}
          <div
            className="lg:hidden flex flex-col items-center pt-2 pb-1"
            style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
          >
            <div className="grab-handle" />
            <span className="font-data text-[10px] mt-1" style={{ color: "var(--text-dim)" }}>Swipe or tap to dismiss</span>
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
      <div className="px-4 py-1.5 text-center shrink-0" style={{ background: "var(--surface2)", borderTop: "1px solid var(--border)" }}>
        <p className="font-data text-[10px] tracking-[0.05em]" style={{ color: "var(--text-dim)" }}>
          Designed & Built by <span style={{ color: "var(--accent)" }}>Muhammad Haris</span>
        </p>
      </div>

      {/* Zap Me overlay */}
      {showZap && (
        data ? (
          <ZapMe news={data} onClose={() => setShowZap(false)} />
        ) : (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--bg) 95%, transparent)" }}>
            <div className="text-center">
              <p className="font-serif-body text-sm mb-4" style={{ color: "var(--text-dim)" }}>No news data available yet.</p>
              <button onClick={() => setShowZap(false)} className="font-data text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--accent)" }}>Close</button>
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
          <div className="fixed inset-0 z-[9998] flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--bg) 95%, transparent)" }}>
            <div className="text-center">
              <p className="font-serif-body text-sm mb-4" style={{ color: "var(--text-dim)" }}>No news data available yet.</p>
              <button onClick={() => setShowTrends(false)} className="font-data text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--accent)" }}>Close</button>
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
          <div className="fixed inset-0 z-[9998] flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--bg) 95%, transparent)" }}>
            <div className="text-center">
              <p className="font-serif-body text-sm mb-4" style={{ color: "var(--text-dim)" }}>No news data available yet.</p>
              <button onClick={() => setShowChat(false)} className="font-data text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--accent)" }}>Close</button>
            </div>
          </div>
        )
      )}
      {/* Floating chat button */}
      {data && data.countries.length > 0 && !showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 z-[9000] w-12 h-12 shadow-lg flex items-center justify-center font-data text-xs font-bold transition-colors hover:opacity-80"
          style={{ background: "var(--accent)", color: "var(--bg)" }}
          title="Ask the News"
        >
          ASK
        </button>
      )}
    </div>
  );
}
