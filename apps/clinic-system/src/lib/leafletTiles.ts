/** Google Maps tiles. The previous frame stays on screen while the next zoom loads. */

import type { TileLayer as LeafletTileLayer } from "leaflet";

export type LeafletModule = typeof import("leaflet");
export type LeafletMap = import("leaflet").Map;

/** auto = roadmap with POIs | satellite | hybrid | terrain */
export type MapDisplayStyle = "auto" | "satellite" | "hybrid" | "terrain";

/** Google lyrs codes — roadmap (m) includes restaurants, mosques, hospitals, etc. */
const GOOGLE_LYRS: Record<MapDisplayStyle, string> = {
  auto: "m",
  satellite: "s",
  hybrid: "y",
  terrain: "p",
};

const STYLE_CLASS: Record<MapDisplayStyle, string> = {
  auto: "map-style-auto",
  satellite: "map-style-satellite",
  hybrid: "map-style-hybrid",
  terrain: "map-style-terrain",
};

/** Same paper color as Google Maps, so a tile that is still arriving is not a black square. */
const STYLE_FILL: Record<MapDisplayStyle, string> = {
  auto: "#f2efe9",
  satellite: "#8d8680",
  hybrid: "#8d8680",
  terrain: "#e4dcc4",
};

const TILE_OPTS = {
  subdomains: "0123",
  maxZoom: 21,
  maxNativeZoom: 21,
  minZoom: 3,
  tileSize: 256,
  detectRetina: false,
  updateWhenIdle: true,
  updateWhenZooming: false,
  keepBuffer: 8,
};

function tileLang(locale: string): "ar" | "en" {
  return isArabicLocale(locale) ? "ar" : "en";
}

function googleTileUrl(lyrs: string, lang: "ar" | "en"): string {
  return `https://mt{s}.google.com/vt/lyrs=${lyrs}&hl=${lang}&gl=IQ&x={x}&y={y}&z={z}`;
}

function markMapStyle(map: LeafletMap, style: MapDisplayStyle) {
  const container = map.getContainer();
  Object.values(STYLE_CLASS).forEach((name) => container.classList.remove(name));
  container.classList.add(STYLE_CLASS[style]);
  container.style.setProperty("background", STYLE_FILL[style], "important");
}

export function isArabicLocale(locale: string): boolean {
  return locale === "ar" || locale.startsWith("ar-");
}

/** Create a Google Maps tile layer. The URL stays stable so the browser can keep tiles. */
export function createGoogleTileLayer(
  L: LeafletModule,
  locale: string,
  style: MapDisplayStyle = "auto"
): LeafletTileLayer {
  const lang = tileLang(locale);
  const lyrs = GOOGLE_LYRS[style];
  const ar = lang === "ar";

  return L.tileLayer(googleTileUrl(lyrs, lang), {
    ...TILE_OPTS,
    attribution: ar
      ? '&copy; <a href="https://www.google.com/maps">خرائط Google</a>'
      : '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
  });
}

/** Replace the base map with a Google layer for the chosen style. */
export function setMapDisplayStyle(
  map: LeafletMap,
  currentLayers: LeafletTileLayer[],
  L: LeafletModule,
  locale: string,
  style: MapDisplayStyle
): LeafletTileLayer[] {
  const layer = createGoogleTileLayer(L, locale, style);
  layer.addTo(map);
  currentLayers.forEach((old) => {
    if (old !== layer && map.hasLayer(old)) map.removeLayer(old);
  });
  markMapStyle(map, style);
  return [layer];
}

export function applyHighQualityTiles(
  L: LeafletModule,
  map: LeafletMap,
  locale = "ar",
  style: MapDisplayStyle = "auto"
): LeafletTileLayer[] {
  return setMapDisplayStyle(map, [], L, locale, style);
}

export const MAP_DEFAULTS = {
  maxZoom: 21,
  minZoom: 3,
  zoomSnap: 1,
  zoomDelta: 1,
  wheelPxPerZoomLevel: 60,
  fadeAnimation: true,
  zoomAnimation: true,
  markerZoomAnimation: true,
} as const;

export const MAP_REFRESH_MS = 20_000;

export function getMapPreconnectHosts(_locale = "ar"): string[] {
  return [0, 1, 2, 3].map((n) => `https://mt${n}.google.com`);
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
