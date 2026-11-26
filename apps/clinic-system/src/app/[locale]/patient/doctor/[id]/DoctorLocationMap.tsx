"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { MapDisplayStyle } from "@/lib/leafletTiles";
import MapStyleSwitcher from "@/components/ui/MapStyleSwitcher";

const OFM_LIBERTY = "https://tiles.openfreemap.org/styles/liberty";
const OFM_BRIGHT  = "https://tiles.openfreemap.org/styles/bright";

function rasterStyle(tileUrl: string, attribution = ""): object {
  return {
    version: 8,
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
      raster: { type: "raster", tiles: [tileUrl], tileSize: 256, attribution, maxzoom: 19 },
    },
    layers: [{ id: "raster-bg", type: "raster", source: "raster" }],
  };
}

async function hybridStyle(origin: string): Promise<object> {
  try {
    const style = await (await fetch(OFM_LIBERTY)).json();
    style.sources = {
      __satellite: { type: "raster", tiles: [`${origin}/api/tiles/{z}/{x}/{y}.png?s=satellite`], tileSize: 256, maxzoom: 19, attribution: "© Esri" },
      ...style.sources,
    };
    style.layers = [{ id: "__sat_bg", type: "raster", source: "__satellite", maxzoom: 24 }, ...style.layers];
    return style;
  } catch {
    return rasterStyle(`${origin}/api/tiles/{z}/{x}/{y}.png?s=satellite`, "© Esri");
  }
}

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
  const markerRef = useRef<any>(null);
  const mlRef = useRef<any>(null);
  const [mapStyle, setMapStyle] = useState<MapDisplayStyle>("auto");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      mlRef.current = maplibregl;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: OFM_LIBERTY,
        center: [lng, lat],
        zoom: 17,
        maxZoom: 20,
        minZoom: 3,
        scrollZoom: false,
        pitchWithRotate: false,
        dragRotate: false,
        touchPitch: false,
        keyboard: false,
        attributionControl: true,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

      map.on("load", () => {
        if (cancelled) return;
        const el = document.createElement("div");
        el.style.cssText = `
          display:flex;flex-direction:column;align-items:center;cursor:default;
        `;
        el.innerHTML = `
          <div style="
            background:linear-gradient(135deg,#6366f1,#8b5cf6);
            border:3px solid #818cf8;border-radius:50%;
            width:46px;height:46px;
            display:flex;align-items:center;justify-content:center;font-size:22px;
            box-shadow:0 4px 20px rgba(99,102,241,0.6);
          ">🏥</div>
          <div style="
            width:0;height:0;
            border-left:8px solid transparent;border-right:8px solid transparent;
            border-top:10px solid #6366f1;margin-top:-2px;
          "></div>`;

        markerRef.current = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([lng, lat])
          .setPopup(new maplibregl.Popup({ offset: 55 }).setHTML(`<b>${name}</b>`))
          .addTo(map);

        markerRef.current.togglePopup();
      });

      mapRef.current = map;

      if (cancelled) {
        map.remove();
        mapRef.current = null;
        mlRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      mlRef.current = null;
    };
  }, [lat, lng, name, locale]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    (async () => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      if (mapStyle === "auto")       map.setStyle(OFM_LIBERTY);
      else if (mapStyle === "terrain") map.setStyle(OFM_BRIGHT);
      else if (mapStyle === "satellite")
        map.setStyle(rasterStyle(`${origin}/api/tiles/{z}/{x}/{y}.png?s=satellite`, "© Esri") as any);
      else if (mapStyle === "hybrid")
        map.setStyle((await hybridStyle(origin)) as any);
    })();
  }, [mapStyle]);

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
