/**
 * Tile-layer helpers for Leaflet maps.
 *
 * All tiles are proxied through /api/tiles so they work in WebView & Electron.
 *
 * "auto"      → CartoDB Voyager  (modern colourful road map — industry standard)
 * "satellite" → ESRI World Imagery  (satellite, with CartoDB Voyager fallback)
 * "hybrid"    → ESRI Imagery + CartoDB labels overlay
 * "terrain"   → ESRI World Topo Map (with CartoDB Voyager fallback)
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

/** Tile background colour while loading — matches each provider's paper colour. */
const STYLE_FILL: Record<MapDisplayStyle, string> = {
  auto:      "#f4f1ec",   // CartoDB Voyager cream
  satellite: "#2a2724",   // dark earth tone
  hybrid:    "#2a2724",
  terrain:   "#e8e0d4",   // ESRI Topo light tan
};

/** Performance options — minimise tile requests during animation on mobile. */
const PERF_OPTS = {
  maxZoom:          19,
  maxNativeZoom:    19,
  minZoom:          3,
  tileSize:         256,
  detectRetina:     false,
  updateWhenIdle:   true,       // load tiles only after map stops moving
  updateWhenZooming: false,     // no requests during zoom animation
  updateInterval:   150,
  keepBuffer:       6,
  crossOrigin:      false as const,
} as const;

/** Proxy base — all tiles go through the same origin */
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
 * Returns one or two tile layers for the requested style.
 * "hybrid" returns [imagery, labels] — both layers must be added to the map.
 */
function createTileLayers(
  L: LeafletModule,
  _locale: string,
  style: MapDisplayStyle = "auto"
): LeafletTileLayer[] {
  if (style === "satellite") {
    return [
      L.tileLayer(`${PROXY}/{z}/{x}/{y}.png?s=satellite`, {
        ...PERF_OPTS,
        attribution: "Imagery &copy; <a href='https://www.esri.com'>Esri</a>",
      }),
    ];
  }

  if (style === "hybrid") {
    return [
      L.tileLayer(`${PROXY}/{z}/{x}/{y}.png?s=satellite`, {
        ...PERF_OPTS,
        attribution: "Imagery &copy; Esri",
      }),
      L.tileLayer(`${PROXY}/{z}/{x}/{y}.png?s=labels`, {
        ...PERF_OPTS,
        opacity: 0.95,
        pane: "overlayPane",
      }),
    ];
  }

  if (style === "terrain") {
    return [
      L.tileLayer(`${PROXY}/{z}/{x}/{y}.png?s=terrain`, {
        ...PERF_OPTS,
        attribution: "Tiles &copy; <a href='https://www.esri.com'>Esri</a>",
      }),
    ];
  }

  // Default "auto" — CartoDB Voyager (modern, clean, free, no API key)
  return [
    L.tileLayer(`${PROXY}/{z}/{x}/{y}.png`, {
      ...PERF_OPTS,
      attribution:
        '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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

/** @deprecated use setMapDisplayStyle / createTileLayers instead */
export function createGoogleTileLayer(
  L: LeafletModule,
  locale: string,
  style: MapDisplayStyle = "auto"
): LeafletTileLayer {
  return createTileLayers(L, locale, style)[0];
}

/** Leaflet map constructor defaults — tuned for smooth mobile panning. */
export const MAP_DEFAULTS = {
  maxZoom:            19,
  minZoom:            3,
  zoomSnap:           1,
  zoomDelta:          1,
  wheelPxPerZoomLevel: 60,
  wheelDebounceTime:  40,
  fadeAnimation:      true,
  zoomAnimation:      true,
  markerZoomAnimation: true,
  inertia:            true,
  inertiaDeceleration: 2000,
  easeLinearity:      0.2,
  preferCanvas:       true,
} as const;

export const MAP_REFRESH_MS = 4_000;

export function getMapPreconnectHosts(_locale = "ar"): string[] {
  return [
    "https://a.basemaps.cartocdn.com",
    "https://server.arcgisonline.com",
  ];
}

export function getMapStyleLabel(style: MapDisplayStyle, ar: boolean): string {
  const labels: Record<MapDisplayStyle, { ar: string; en: string }> = {
    auto:      { ar: "خرائط",       en: "Map"       },
    satellite: { ar: "قمر صناعي",   en: "Satellite" },
    hybrid:    { ar: "هجين",        en: "Hybrid"    },
    terrain:   { ar: "تضاريس",     en: "Terrain"   },
  };
  return ar ? labels[style].ar : labels[style].en;
}
