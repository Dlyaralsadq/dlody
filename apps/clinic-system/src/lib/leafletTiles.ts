/**
 * Tile-layer helpers for Leaflet maps.
 *
 * "auto"     → OSM proxied through tabibee.com (works everywhere: browser/WebView/Electron)
 * "satellite" → ESRI World Imagery (free, CORS-enabled, works in all WebViews)
 * "hybrid"   → ESRI imagery + CartoDB labels overlay
 * "terrain"  → ESRI World Topo Map
 */

import type { TileLayer as LeafletTileLayer } from "leaflet";

export type LeafletModule = typeof import("leaflet");
export type LeafletMap = import("leaflet").Map;

/** auto = roadmap | satellite | hybrid | terrain */
export type MapDisplayStyle = "auto" | "satellite" | "hybrid" | "terrain";

const STYLE_CLASS: Record<MapDisplayStyle, string> = {
  auto: "map-style-auto",
  satellite: "map-style-satellite",
  hybrid: "map-style-hybrid",
  terrain: "map-style-terrain",
};

/** Tile-loading background color while tiles arrive. */
const STYLE_FILL: Record<MapDisplayStyle, string> = {
  auto: "#f2efe9",
  satellite: "#8d8680",
  hybrid: "#8d8680",
  terrain: "#e4dcc4",
};

/** Common performance options — reduce tile requests while animating. */
const PERF_OPTS = {
  maxZoom: 19,
  maxNativeZoom: 19,
  minZoom: 3,
  tileSize: 256,
  detectRetina: false,
  updateWhenIdle: true,       // only load tiles once the map stops moving
  updateWhenZooming: false,   // no tile requests during zoom animation
  updateInterval: 100,
  keepBuffer: 8,              // buffer 8 extra tile rows/cols around the viewport
} as const;

/** Proxied OSM tiles — same-origin, works in all environments. */
const OSM_URL = "/api/tiles/{z}/{x}/{y}.png";

function markMapStyle(map: LeafletMap, style: MapDisplayStyle) {
  const container = map.getContainer();
  Object.values(STYLE_CLASS).forEach((name) => container.classList.remove(name));
  container.classList.add(STYLE_CLASS[style]);
  container.style.setProperty("background", STYLE_FILL[style], "important");
}

export function isArabicLocale(locale: string): boolean {
  return locale === "ar" || locale.startsWith("ar-");
}

/**
 * Returns one or two tile layers for the requested style.
 * ALL tiles are proxied through /api/tiles so they work in WebView & Electron.
 * "hybrid" returns [imagery, labels] — both must be added to the map.
 */
function createTileLayers(
  L: LeafletModule,
  _locale: string,
  style: MapDisplayStyle = "auto"
): LeafletTileLayer[] {
  if (style === "auto") {
    return [
      L.tileLayer(OSM_URL, {
        ...PERF_OPTS,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }),
    ];
  }

  if (style === "satellite") {
    // Proxied ESRI World Imagery — same-origin, works in all WebViews
    return [
      L.tileLayer("/api/tiles/{z}/{x}/{y}.png?s=satellite", {
        ...PERF_OPTS,
        attribution: "Tiles &copy; Esri",
      }),
    ];
  }

  if (style === "hybrid") {
    return [
      // base: ESRI satellite imagery (proxied)
      L.tileLayer("/api/tiles/{z}/{x}/{y}.png?s=satellite", {
        ...PERF_OPTS,
        attribution: "Tiles &copy; Esri",
      }),
      // overlay: CartoDB labels only (proxied)
      L.tileLayer("/api/tiles/{z}/{x}/{y}.png?s=labels", {
        ...PERF_OPTS,
        opacity: 0.9,
        pane: "overlayPane",
      }),
    ];
  }

  if (style === "terrain") {
    // Proxied ESRI World Topo Map
    return [
      L.tileLayer("/api/tiles/{z}/{x}/{y}.png?s=terrain", {
        ...PERF_OPTS,
        attribution: "Tiles &copy; Esri",
      }),
    ];
  }

  // fallback
  return [L.tileLayer(OSM_URL, { ...PERF_OPTS })];
}

/** Replace the current tile layers with layers for the chosen style. */
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

/**
 * @deprecated Use setMapDisplayStyle / createTileLayers instead.
 * Returns only the first (base) layer.
 */
export function createGoogleTileLayer(
  L: LeafletModule,
  locale: string,
  style: MapDisplayStyle = "auto"
): LeafletTileLayer {
  return createTileLayers(L, locale, style)[0];
}

/** Leaflet map constructor defaults — tuned for smooth mobile panning. */
export const MAP_DEFAULTS = {
  maxZoom: 19,
  minZoom: 3,
  zoomSnap: 1,              // snap to whole zoom levels → fewer tile requests
  zoomDelta: 1,
  wheelPxPerZoomLevel: 60,
  wheelDebounceTime: 40,
  fadeAnimation: true,
  zoomAnimation: true,
  markerZoomAnimation: true,
  inertia: true,
  inertiaDeceleration: 2000,
  easeLinearity: 0.2,
  preferCanvas: true,       // use <canvas> for vector layers — faster on mobile
} as const;

export const MAP_REFRESH_MS = 4_000;

export function getMapPreconnectHosts(_locale = "ar"): string[] {
  // ESRI domains used by satellite / hybrid / terrain
  return [
    "https://server.arcgisonline.com",
    "https://a.basemaps.cartocdn.com",
  ];
}

export function getMapStyleLabel(style: MapDisplayStyle, ar: boolean): string {
  const labels: Record<MapDisplayStyle, { ar: string; en: string }> = {
    auto: { ar: "خرائط", en: "Map" },
    satellite: { ar: "قمر صناعي", en: "Satellite" },
    hybrid: { ar: "هجين", en: "Hybrid" },
    terrain: { ar: "تضاريس", en: "Terrain" },
  };
  return ar ? labels[style].ar : labels[style].en;
}
