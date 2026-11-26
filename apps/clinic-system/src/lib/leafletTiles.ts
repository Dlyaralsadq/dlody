/**
 * Tile-layer helpers for Leaflet maps.
 *
 * All tiles proxied through /api/tiles — same-origin requests work in
 * every environment (browser, Android WebView, Electron).
 *
 * Provider: ESRI ArcGIS Living Atlas (free-to-use for public display)
 *   auto      → ESRI World Street Map   (Google-Maps quality road map)
 *   satellite → ESRI World Imagery      (high-res satellite photography)
 *   hybrid    → ESRI Imagery + ESRI Reference Overlay (labels)
 *   terrain   → ESRI World Topo Map     (topographic / hillshading)
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

/** Loading background colour — matches each provider's paper colour so tiles
 *  never flash as a black square while loading. */
const STYLE_FILL: Record<MapDisplayStyle, string> = {
  auto:      "#f2efe9",   // OSM classic light cream
  satellite: "#1e1a16",   // dark earth tone
  hybrid:    "#1e1a16",
  terrain:   "#f0ede6",   // ESRI Topo light parchment
};

/** Performance options tuned for smooth mobile scrolling/zooming */
const PERF_OPTS = {
  maxZoom:           20,    // allow zooming in to building level
  maxNativeZoom:     19,    // OSM/ESRI max native zoom
  minZoom:           3,
  tileSize:          256,
  detectRetina:      false,
  updateWhenIdle:    true,        // only load tiles after map stops
  updateWhenZooming: false,       // no tile requests during zoom animation
  updateInterval:    150,
  keepBuffer:        6,
  crossOrigin:       false as const,
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
 * Returns one or two tile layers for the requested style.
 * "hybrid" returns [imagery, labels] — both layers are added to the map.
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
        attribution:
          "Imagery &copy; <a href='https://www.esri.com'>Esri</a>, Maxar, Earthstar Geographics",
      }),
    ];
  }

  if (style === "hybrid") {
    return [
      // base: ESRI satellite imagery
      L.tileLayer(`${PROXY}/{z}/{x}/{y}.png?s=satellite`, {
        ...PERF_OPTS,
        attribution: "Imagery &copy; Esri",
      }),
      // overlay: OSM roads, buildings, POI labels at semi-transparency
      // gives satellite imagery + all street names, buildings, shops, etc.
      L.tileLayer(`${PROXY}/{z}/{x}/{y}.png`, {
        ...PERF_OPTS,
        opacity: 0.55,
        pane: "overlayPane",
      }),
    ];
  }

  if (style === "terrain") {
    return [
      L.tileLayer(`${PROXY}/{z}/{x}/{y}.png?s=terrain`, {
        ...PERF_OPTS,
        attribution:
          "Tiles &copy; <a href='https://www.esri.com'>Esri</a>, USGS, NOAA",
      }),
    ];
  }

  // Default "auto" — OpenStreetMap: richest dataset on Earth.
  // Buildings visible at zoom 15+, all POIs (shops/pharmacies/hotels/hospitals/
  // mosques/restaurants/banks/schools) at zoom 16+, Arabic street names everywhere.
  return [
    L.tileLayer(`${PROXY}/{z}/{x}/{y}.png`, {
      ...PERF_OPTS,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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

/** Leaflet map constructor defaults — tuned for smooth mobile panning. */
export const MAP_DEFAULTS = {
  maxZoom:             20,  // allows zooming to individual building level
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
  return ["https://server.arcgisonline.com"];
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
