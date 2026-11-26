/**
 * Tile-layer helpers for Leaflet maps.
 *
 * All tiles are proxied through /api/tiles (same-origin) so they work in
 * every environment: browser, Android WebView, Electron.
 *
 * Provider: Mapbox (world-class quality, free up to 50k loads/month)
 *   auto      → Mapbox Streets v12          — full POIs, buildings, Arabic labels
 *   satellite → Mapbox Satellite v9         — high-res satellite imagery
 *   hybrid    → Mapbox Satellite Streets v12 — satellite + ALL labels & POIs
 *   terrain   → Mapbox Outdoors v12         — terrain / topographic style
 *
 * Falls back to OSM/ESRI if MAPBOX_TOKEN env var is not set.
 */

import type { TileLayer as LeafletTileLayer } from "leaflet";

export type LeafletModule = typeof import("leaflet");
export type LeafletMap   = import("leaflet").Map;

export type MapDisplayStyle = "auto" | "satellite" | "hybrid" | "terrain";

const STYLE_CLASS: Record<MapDisplayStyle, string> = {
  auto:      "map-style-auto",
  satellite: "map-style-satellite",
  hybrid:    "map-style-hybrid",
  terrain:   "map-style-terrain",
};

/** Loading background colour while first tiles arrive */
const STYLE_FILL: Record<MapDisplayStyle, string> = {
  auto:      "#f8f4f0",   // Mapbox Streets warm white
  satellite: "#1a1a1a",   // dark while satellite loads
  hybrid:    "#1a1a1a",
  terrain:   "#eae6de",   // Mapbox Outdoors light
};

/** Performance options — tuned for smooth mobile panning & zooming */
const PERF_OPTS = {
  maxZoom:            22,   // Mapbox supports zoom 22 (building-level detail)
  maxNativeZoom:      20,   // native tiles up to zoom 20
  minZoom:            3,
  tileSize:           256,
  detectRetina:       false,
  updateWhenIdle:     true,
  updateWhenZooming:  false,
  updateInterval:     150,
  keepBuffer:         6,
  crossOrigin:        false as const,
} as const;

const PROXY = "/api/tiles";

function markMapStyle(map: LeafletMap, style: MapDisplayStyle) {
  const container = map.getContainer();
  Object.values(STYLE_CLASS).forEach((c) => container.classList.remove(c));
  container.classList.add(STYLE_CLASS[style]);
  container.style.setProperty("background", STYLE_FILL[style], "important");
}

export function isArabicLocale(locale: string): boolean {
  return locale === "ar" || locale.startsWith("ar-");
}

/**
 * Returns one tile layer for the requested style.
 * All 4 styles are powered by Mapbox (via proxy) — world-class quality.
 */
function createTileLayers(
  L: LeafletModule,
  _locale: string,
  style: MapDisplayStyle = "auto"
): LeafletTileLayer[] {

  const attribution =
    '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> ' +
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  if (style === "satellite") {
    return [
      L.tileLayer(`${PROXY}/{z}/{x}/{y}.png?s=satellite`, {
        ...PERF_OPTS,
        attribution,
      }),
    ];
  }

  if (style === "hybrid") {
    // Mapbox Satellite Streets — single layer with satellite imagery + full POI labels
    // This is better than a 2-layer composite: sharper, faster, more consistent
    return [
      L.tileLayer(`${PROXY}/{z}/{x}/{y}.png?s=hybrid`, {
        ...PERF_OPTS,
        attribution,
      }),
    ];
  }

  if (style === "terrain") {
    return [
      L.tileLayer(`${PROXY}/{z}/{x}/{y}.png?s=terrain`, {
        ...PERF_OPTS,
        attribution,
      }),
    ];
  }

  // Default "auto" — Mapbox Streets v12
  // Shows: roads, buildings (zoom 15+), all POIs (zoom 15+),
  // Arabic / English labels, parks, water bodies, landmarks
  return [
    L.tileLayer(`${PROXY}/{z}/{x}/{y}.png`, {
      ...PERF_OPTS,
      attribution,
    }),
  ];
}

/** Replace current tile layers with layers for the chosen style. */
export function setMapDisplayStyle(
  map: LeafletMap,
  currentLayers: LeafletTileLayer[],
  L: LeafletModule,
  locale: string,
  style: MapDisplayStyle
): LeafletTileLayer[] {
  const newLayers = createTileLayers(L, locale, style);
  newLayers.forEach((l) => l.addTo(map));
  currentLayers.forEach((old) => {
    if (!newLayers.includes(old) && map.hasLayer(old)) map.removeLayer(old);
  });
  markMapStyle(map, style);
  return newLayers;
}

export function applyHighQualityTiles(
  L: LeafletModule,
  map: LeafletMap,
  locale = "ar",
  style: MapDisplayStyle = "auto"
): LeafletTileLayer[] {
  return setMapDisplayStyle(map, [], L, locale, style);
}

/** @deprecated use setMapDisplayStyle instead */
export function createGoogleTileLayer(
  L: LeafletModule,
  locale: string,
  style: MapDisplayStyle = "auto"
): LeafletTileLayer {
  return createTileLayers(L, locale, style)[0];
}

/** Leaflet map constructor defaults */
export const MAP_DEFAULTS = {
  maxZoom:             22,
  minZoom:             3,
  zoomSnap:            1,
  zoomDelta:           1,
  wheelPxPerZoomLevel: 60,
  wheelDebounceTime:   40,
  fadeAnimation:       true,
  zoomAnimation:       true,
  markerZoomAnimation: true,
  inertia:             true,
  inertiaDeceleration: 2000,
  easeLinearity:       0.2,
  preferCanvas:        true,
} as const;

export const MAP_REFRESH_MS = 4_000;

export function getMapPreconnectHosts(_locale = "ar"): string[] {
  return ["https://api.mapbox.com"];
}

export function getMapStyleLabel(style: MapDisplayStyle, ar: boolean): string {
  const labels: Record<MapDisplayStyle, { ar: string; en: string }> = {
    auto:      { ar: "خرائط",     en: "Map"       },
    satellite: { ar: "قمر صناعي", en: "Satellite" },
    hybrid:    { ar: "هجين",      en: "Hybrid"    },
    terrain:   { ar: "تضاريس",   en: "Terrain"   },
  };
  return ar ? labels[style].ar : labels[style].en;
}
