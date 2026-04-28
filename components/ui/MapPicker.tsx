"use client";

/**
 * MapPicker — interactive map for selecting a lat/lng position.
 * Uses Leaflet + OpenStreetMap (free, no API key required).
 *
 * Usage:
 *   <MapPicker lat={lat} lng={lng} onChange={(lat, lng) => ...} />
 */

import { useEffect, useRef, useState } from "react";

interface MapPickerProps {
  lat?: number | null;
  lng?: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

// Default center: Bangkok
const DEFAULT_CENTER: [number, number] = [13.7563, 100.5018];
const DEFAULT_ZOOM = 12;

export default function MapPicker({ lat, lng, onChange, height = "320px" }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    lat != null && lng != null ? { lat, lng } : null
  );

  // Bootstrap Leaflet (client-side only)
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapRef.current) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      // Guard: cleanup ran before async import resolved
      if (cancelled || !containerRef.current || mapRef.current) return;

      // @ts-expect-error _getIconUrl is internal
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const center: [number, number] =
        lat != null && lng != null ? [lat, lng] : DEFAULT_CENTER;

      const map = L.map(containerRef.current!, {
        center,
        zoom: lat != null ? 16 : DEFAULT_ZOOM,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (lat != null && lng != null) {
        const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          setCoords({ lat: p.lat, lng: p.lng });
          onChange(p.lat, p.lng);
        });
        markerRef.current = marker;
      }

      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        } else {
          markerRef.current = L.marker([clickLat, clickLng], { draggable: true }).addTo(map);
          markerRef.current.on("dragend", () => {
            const p = markerRef.current!.getLatLng();
            setCoords({ lat: p.lat, lng: p.lng });
            onChange(p.lat, p.lng);
          });
        }
        setCoords({ lat: clickLat, lng: clickLng });
        onChange(clickLat, clickLng);
      });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search via Nominatim (OpenStreetMap geocoding — free, no key)
  const handleSearch = async () => {
    if (!search.trim() || !mapRef.current) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=1`,
        { headers: { "Accept-Language": "th,en" } }
      );
      const json = await res.json();
      if (json.length === 0) { alert("ไม่พบสถานที่ กรุณาลองคำค้นอื่น"); return; }
      const { lat: rLat, lon: rLon } = json[0];
      const newLat = parseFloat(rLat);
      const newLng = parseFloat(rLon);

      import("leaflet").then((L) => {
        mapRef.current!.setView([newLat, newLng], 16);
        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        } else {
          markerRef.current = L.marker([newLat, newLng], { draggable: true }).addTo(mapRef.current!);
          markerRef.current.on("dragend", () => {
            const p = markerRef.current!.getLatLng();
            setCoords({ lat: p.lat, lng: p.lng });
            onChange(p.lat, p.lng);
          });
        }
        setCoords({ lat: newLat, lng: newLng });
        onChange(newLat, newLng);
      });
    } catch { alert("ค้นหาไม่สำเร็จ"); }
    finally { setSearching(false); }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) { alert("Browser ไม่รองรับ Geolocation"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        import("leaflet").then((L) => {
          mapRef.current?.setView([newLat, newLng], 17);
          if (markerRef.current) {
            markerRef.current.setLatLng([newLat, newLng]);
          } else {
            markerRef.current = L.marker([newLat, newLng], { draggable: true }).addTo(mapRef.current!);
            markerRef.current.on("dragend", () => {
              const p = markerRef.current!.getLatLng();
              setCoords({ lat: p.lat, lng: p.lng });
              onChange(p.lat, p.lng);
            });
          }
          setCoords({ lat: newLat, lng: newLng });
          onChange(newLat, newLng);
        });
        setLocating(false);
      },
      () => { alert("ไม่สามารถดึงตำแหน่งได้ กรุณาอนุญาต Location ใน browser"); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleClear = () => {
    markerRef.current?.remove();
    markerRef.current = null;
    setCoords(null);
    onChange(0, 0); // signal clear — consumer should treat 0,0 as null
  };

  return (
    <div className="space-y-2">
      {/* Search bar — uses div, not form, to avoid nested-form hydration error */}
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
          placeholder="ค้นหาสถานที่… เช่น สยามพารากอน, Bangkok"
          className="fsm-input flex-1 text-sm"
        />
        <button type="button" onClick={handleSearch} disabled={searching}
          className="shrink-0 bg-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50 rounded">
          {searching ? "…" : "🔍 ค้นหา"}
        </button>
        <button type="button" onClick={handleLocate} disabled={locating}
          className="shrink-0 bg-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50 rounded"
          title="ใช้ตำแหน่งปัจจุบัน">
          {locating ? "…" : "📍 ฉัน"}
        </button>
      </div>

      {/* Map container — Leaflet CSS loaded via link tag */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full rounded border border-slate-700 overflow-hidden z-0"
      />

      {/* Coordinates display */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        {coords ? (
          <span>
            📍 {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </span>
        ) : (
          <span>คลิกบนแผนที่หรือค้นหาเพื่อเลือกตำแหน่ง</span>
        )}
        {coords && (
          <button type="button" onClick={handleClear}
            className="text-red-500 hover:text-red-400">
            ✕ ล้างตำแหน่ง
          </button>
        )}
      </div>
    </div>
  );
}
