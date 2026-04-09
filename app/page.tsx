"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import LoadingOverlay from "./components/LoadingOverlay";
import EmptyState from "./components/EmptyState";
import ZapMe from "./components/ZapMe";
import { NewsData } from "@/types/news";

const Map = dynamic(() => import("./components/Map"), { ssr: false });

export default function Home() {
  const [data, setData] = useState<NewsData | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showZap, setShowZap] = useState(false);

  const fetchNews = useCallback(async (refresh = true) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news${refresh ? "?refresh=true" : ""}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      const json: NewsData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount and every 6 hours
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    fetchNews(false);
    intervalRef.current = setInterval(() => {
      fetchNews(true);
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

  return (
    <div className="flex flex-col h-screen bg-bg text-text-main overflow-hidden">
      <Header
        updatedAt={data?.updated_at ?? null}
        storyCount={storyCount}
        countryCount={countryCount}
        loading={loading}
        hasNews={!!data && data.countries.length > 0}
        onFetch={() => fetchNews(true)}
        onZap={() => setShowZap(true)}
      />

      {/* AI Disclaimer */}
      <div className="bg-surface-2 border-b border-border px-4 py-1.5 text-center shrink-0">
        <p className="text-[11px] font-mono text-text-dim">
          ⚠ Content is generated using AI and may contain inaccuracies. Verify important information with original sources.
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Map area */}
        <div className="flex-1 relative">
          <Map
            countries={data?.countries ?? []}
            selectedCountry={selectedCountry}
            onSelectCountry={(code) => handleSelectCountry(code)}
          />

          {loading && <LoadingOverlay />}
          {!data && !loading && <EmptyState />}
          {error && !loading && (
            <div className="absolute bottom-4 left-4 z-40 bg-accent-2/20 border border-accent-2 text-accent-2 rounded-lg px-4 py-2 text-sm font-mono">
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
            countries={data?.countries ?? []}
            selectedCountry={selectedCountry}
            onSelectCountry={handleSelectCountry}
          />
        </div>
      </div>
      {/* Zap Me overlay */}
      {showZap && data && (
        <ZapMe news={data} onClose={() => setShowZap(false)} />
      )}
    </div>
  );
}
