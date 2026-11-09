"use client";

import { useEffect, useRef, useState } from "react";
import {
  applyHighQualityTiles,
  MAP_DEFAULTS,
  setMapDisplayStyle,
  type MapDisplayStyle,
} from "@/lib/leafletTiles";
import { loadLeafletMap } from "@/lib/leafletLoader";
import MapStyleSwitcher from "@/components/ui/MapStyleSwitcher";

export default function DoctorLocationMap({
  lat,
  lng,
  name,
  locale,
}: {
  lat: number;
  lng: number;
  name: string;
  locale: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileLayersRef = useRef<import("leaflet").TileLayer[]>([]);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const [mapStyle, setMapStyle] = useState<MapDisplayStyle>("auto");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    (async () => {
      const L = await loadLeafletMap();

      if (cancelled || !containerRef.current || mapRef.current) return;
      if ((containerRef.current as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;

      const map = L.map(containerRef.current!, {
        center: [lat, lng],
        zoom: 17,
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        ...MAP_DEFAULTS,
      });

      tileLayersRef.current = applyHighQualityTiles(L, map, locale, mapStyle);
      leafletRef.current = L;

      const icon = L.divIcon({
        className: "",
        html: `<div style="
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          border:3px solid #818cf8;
          border-radius:50%;
          width:46px;height:46px;
          display:flex;align-items:center;justify-content:center;
          font-size:22px;
          box-shadow:0 4px 20px rgba(99,102,241,0.6);
        ">🏥</div>
        <div style="
          width:0;height:0;
          border-left:8px solid transparent;
          border-right:8px solid transparent;
          border-top:10px solid #6366f1;
          margin:auto;margin-top:-2px;
        "></div>`,
        iconSize: [46, 58],
        iconAnchor: [23, 58],
      });

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<b>${name}</b>`)
        .openPopup();

      if (cancelled) {
        map.remove();
        return;
      }

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      tileLayersRef.current = [];
      leafletRef.current = null;
    };
  }, [lat, lng, name, locale]);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;
    tileLayersRef.current = setMapDisplayStyle(
      map,
      tileLayersRef.current,
      L,
      locale,
      mapStyle
    );
  }, [mapStyle, locale]);

  return (
    <div className="relative w-full">
      <MapStyleSwitcher
        value={mapStyle}
        onChange={setMapStyle}
        locale={locale}
        compact
        className="absolute top-2 end-2 z-[1000] pointer-events-auto"
      />
      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden border border-white/8"
        style={{ height: 240 }}
      />
    </div>
  );
}
