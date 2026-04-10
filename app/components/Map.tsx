"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Country } from "@/types/news";
import { getCountryCoords } from "@/lib/countries";
import { useTheme } from "@/app/contexts/ThemeContext";

const TILE_URLS = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?language=en",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?language=en",
};

interface MapProps {
  countries: Country[];
  selectedCountry: string | null;
  onSelectCountry: (code: string) => void;
  heatmapMode?: boolean;
  sentimentMode?: boolean;
}

export default function Map({ countries, selectedCountry, onSelectCountry, heatmapMode, sentimentMode }: MapProps) {
  const { mode } = useTheme();
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const tileRef = useRef<L.TileLayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const southWest = L.latLng(-60, -180);
    const northEast = L.latLng(85, 180);
    const bounds = L.latLngBounds(southWest, northEast);

    const isMobile = window.innerWidth < 768;
    mapRef.current = L.map(containerRef.current, {
      center: isMobile ? [20, 30] : [30, 40],
      zoom: isMobile ? 2 : 3,
      minZoom: 2,
      maxZoom: 8,
      zoomControl: false,
      attributionControl: false,
      maxBounds: bounds,
      maxBoundsViscosity: 1.0,
      worldCopyJump: false,
    });

    tileRef.current = L.tileLayer(TILE_URLS[mode], {
      maxZoom: 8,
      noWrap: true,
      bounds: bounds,
    }).addTo(mapRef.current);

    L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      tileRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap tile layer when theme mode changes
  useEffect(() => {
    if (!mapRef.current || !tileRef.current) return;
    tileRef.current.setUrl(TILE_URLS[mode]);
  }, [mode]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const maxStories = Math.max(...countries.map((c) => c.stories.length), 1);

    countries.forEach((country) => {
      const coords = getCountryCoords(country.code);
      if (!coords) return;

      const hasConflict = country.stories.some((s) => s.category === "conflict");
      const storyCount = country.stories.length;
      const isSelected = selectedCountry === country.code;

      let radius: number;
      let color: string;
      let fillOpacity: number;

      if (heatmapMode) {
        const intensity = storyCount / maxStories;
        radius = Math.max(intensity * 35 + 10, 12);
        color = intensity > 0.6 ? "#ff3d71" : intensity > 0.3 ? "#fbbf24" : "#34d399";
        fillOpacity = 0.3 + intensity * 0.5;
      } else if (sentimentMode) {
        const score = country.sentiment_score ?? 0;
        radius = Math.min(Math.max(storyCount * 3 + 5, 8), 20);
        color = score > 0.2 ? "#34d399" : score < -0.2 ? "#ff3d71" : "#fbbf24";
        fillOpacity = 0.6;
      } else {
        radius = Math.min(Math.max(storyCount * 3 + 5, 8), 20);
        color = hasConflict ? "#ff3d71" : mode === "light" ? "#0077b6" : "#00e5ff";
        fillOpacity = 0.6;
      }

      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius: isSelected ? radius + 4 : radius,
        fillColor: color,
        fillOpacity: isSelected ? Math.min(fillOpacity + 0.3, 1) : fillOpacity,
        color: color,
        weight: isSelected ? 3 : 1.5,
        opacity: isSelected ? 1 : 0.8,
        className: heatmapMode ? "" : "pulse-marker",
      }).addTo(mapRef.current!);

      const tooltipExtra = sentimentMode && country.overall_sentiment
        ? `<br/>Sentiment: ${country.overall_sentiment}`
        : "";

      marker.bindTooltip(
        `<strong>${country.name}</strong><br/>${storyCount} ${storyCount === 1 ? "story" : "stories"}${tooltipExtra}`,
        {
          className: mode === "light" ? "light-tooltip" : "dark-tooltip",
          direction: "top",
          offset: [0, -radius],
        }
      );

      marker.on("click", () => {
        onSelectCountry(country.code);
      });

      markersRef.current.push(marker);
    });
  }, [countries, selectedCountry, onSelectCountry, heatmapMode, sentimentMode, mode]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      onWheel={(e) => e.preventDefault()}
      style={{ touchAction: "none" }}
    />
  );
}
