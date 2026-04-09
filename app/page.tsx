"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import LoadingOverlay from "./components/LoadingOverlay";

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
  const [data, setData] = useState<NewsData | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setLiveStatus("Connecting...");

    try {
      const res = await fetch("/api/news/stream");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            try {
              const payload = JSON.parse(dataStr);
              if (currentEvent === "status") {
                setLiveStatus(payload.message);
              } else if (currentEvent === "done") {
                if (payload.error) {
                  setError(payload.error);
                }
                if (payload.countries?.length > 0) {
                  setData(payload);
                }
              } else if (currentEvent === "error") {
                setError(payload.error);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setLiveStatus(null);
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
          ⚠ Content is generated using AI and may contain inaccuracies. Verify important information with original sources.
        </p>
      </div>

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
                  className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors ${
                    mapMode === mode
                      ? "bg-accent text-bg font-bold"
                      : "bg-surface/90 text-text-dim hover:text-text-main border border-border"
                  }`}
                >
                  {mode === "default" ? "● Default" : mode === "heatmap" ? "🔥 Heatmap" : "😊 Sentiment"}
                </button>
              ))}
            </div>
          )}

          {/* Sentiment legend */}
          {mapMode === "sentiment" && data && <SentimentLegend />}

          {loading && <LoadingOverlay status={liveStatus} />}
          {error && !loading && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-accent-2/20 border border-accent-2 text-accent-2 rounded-lg px-4 py-2 text-sm font-mono shadow-lg backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* Mobile sidebar toggle */}
          {data && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden absolute bottom-4 right-4 z-40 bg-accent text-bg font-heading font-bold text-xs px-4 py-2 rounded-full shadow-lg"
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
            h-[60vh] lg:h-auto
            w-full lg:w-[340px]
            z-50 lg:z-auto
            transition-transform duration-300 ease-in-out
            shrink-0
          `}
        >
          <Sidebar
            countries={filteredCountries}
            selectedCountry={selectedCountry}
            onSelectCountry={handleSelectCountry}
            favoriteCountries={prefs.favoriteCountries}
          />
        </div>
      </div>
      {/* Zap Me overlay */}
      {showZap && data && (
        <ZapMe news={data} onClose={() => setShowZap(false)} />
      )}
      {/* Timeline overlay */}
      {showTimeline && (
        <Timeline onClose={() => setShowTimeline(false)} />
      )}
      {/* Trends overlay */}
      {showTrends && data && (
        <TrendPanel countries={data.countries} onClose={() => setShowTrends(false)} />
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
      {showChat && data && (
        <NewsChat news={data} onClose={() => setShowChat(false)} />
      )}
      {/* Floating chat button */}
      {data && data.countries.length > 0 && !showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 z-[9000] w-12 h-12 bg-accent text-bg rounded-full shadow-lg flex items-center justify-center text-xl hover:bg-accent/80 transition-colors"
          title="Ask the News"
        >
          💬
        </button>
      )}
    </div>
  );
}
