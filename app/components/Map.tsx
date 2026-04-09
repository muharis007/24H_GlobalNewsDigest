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
}

export default function Map({ countries, selectedCountry, onSelectCountry }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [30, 50],
      zoom: 3,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
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

    countries.forEach((country) => {
      const coords = getCountryCoords(country.code);
      if (!coords) return;

      const hasConflict = country.stories.some((s) => s.category === "conflict");
      const storyCount = country.stories.length;
      const radius = Math.min(Math.max(storyCount * 3 + 5, 8), 20);
      const color = hasConflict ? "#ff3d71" : "#00e5ff";
      const isSelected = selectedCountry === country.code;

      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius: isSelected ? radius + 4 : radius,
        fillColor: color,
        fillOpacity: isSelected ? 0.9 : 0.6,
        color: color,
        weight: isSelected ? 3 : 1.5,
        opacity: isSelected ? 1 : 0.8,
        className: "pulse-marker",
      }).addTo(mapRef.current!);

      marker.bindTooltip(
        `<strong>${country.name}</strong><br/>${storyCount} ${storyCount === 1 ? "story" : "stories"}`,
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
  }, [countries, selectedCountry, onSelectCountry]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
