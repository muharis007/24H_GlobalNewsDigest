"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Country } from "@/types/news";
import { getCountryCoords } from "@/lib/countries";

interface MapProps {
  countries: Country[];
  selectedCountry: string | null;
  onSelectCountry: (code: string) => void;
  heatmapMode?: boolean;
  sentimentMode?: boolean;
}

export default function Map({ countries, selectedCountry, onSelectCountry, heatmapMode, sentimentMode }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const southWest = L.latLng(-60, -180);
    const northEast = L.latLng(85, 180);
    const bounds = L.latLngBounds(southWest, northEast);

    mapRef.current = L.map(containerRef.current, {
      center: [30, 40],
      zoom: 3,
      minZoom: 3,
      maxZoom: 8,
      zoomControl: false,
      attributionControl: false,
      maxBounds: bounds,
      maxBoundsViscosity: 1.0,
      worldCopyJump: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?language=en", {
      maxZoom: 8,
      noWrap: true,
      bounds: bounds,
    }).addTo(mapRef.current);

    L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

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
        // Heatmap: size and opacity based on story count intensity
        const intensity = storyCount / maxStories;
        radius = Math.max(intensity * 35 + 10, 12);
        color = intensity > 0.6 ? "#ff3d71" : intensity > 0.3 ? "#fbbf24" : "#34d399";
        fillOpacity = 0.3 + intensity * 0.5;
      } else if (sentimentMode) {
        // Sentiment: color based on sentiment_score
        const score = country.sentiment_score ?? 0;
        radius = Math.min(Math.max(storyCount * 3 + 5, 8), 20);
        color = score > 0.2 ? "#34d399" : score < -0.2 ? "#ff3d71" : "#fbbf24";
        fillOpacity = 0.6;
      } else {
        radius = Math.min(Math.max(storyCount * 3 + 5, 8), 20);
        color = hasConflict ? "#ff3d71" : "#00e5ff";
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
          className: "dark-tooltip",
          direction: "top",
          offset: [0, -radius],
        }
      );

      marker.on("click", () => {
        onSelectCountry(country.code);
      });

      markersRef.current.push(marker);
    });
  }, [countries, selectedCountry, onSelectCountry, heatmapMode, sentimentMode]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      onWheel={(e) => e.preventDefault()}
      style={{ touchAction: "none" }}
    />
  );
}
