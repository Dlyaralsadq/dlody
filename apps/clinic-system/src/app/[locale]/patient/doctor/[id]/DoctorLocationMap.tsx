"use client";

import { useEffect, useRef } from "react";

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css" as any);

      if (cancelled || !containerRef.current || mapRef.current) return;
      if ((containerRef.current as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;

      const map = L.map(containerRef.current!, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

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
    };
  }, [lat, lng, name]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden border border-white/8"
      style={{ height: 240 }}
    />
  );
}
