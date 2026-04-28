"use client";

/**
 * MapView — read-only map displaying a single marker at lat/lng.
 * Uses Leaflet + OpenStreetMap (free, no API key required).
 */

import { useEffect, useRef } from "react";

interface MapViewProps {
  lat: number;
  lng: number;
  label?: string;
  height?: string;
  zoom?: number;
}

export default function MapView({ lat, lng, label, height = "240px", zoom = 16 }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      // @ts-expect-error _getIconUrl is internal
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: [lat, lng],
        zoom,
        dragging: true,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng]).addTo(map);
      if (label) {
        marker.bindPopup(`<strong>${label}</strong>`).openPopup();
      }

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-1">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full rounded border border-slate-700 overflow-hidden"
      />
      <p className="text-xs text-slate-600">
        📍 {lat.toFixed(6)}, {lng.toFixed(6)}
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-blue-500 hover:text-blue-400"
        >
          เปิดใน Google Maps ↗
        </a>
      </p>
    </div>
  );
}
