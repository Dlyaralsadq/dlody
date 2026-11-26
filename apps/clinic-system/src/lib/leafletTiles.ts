/**
 * Google Maps tiles — served through the same-origin proxy /api/tiles
 * so they work in every environment (browser, Android WebView, desktop PWA)
 * without any CORS blocking or white-screen flash.
 *
 * Visual appearance: identical to the original Google Maps tiles.
 * Performance: tuned for smooth, stutter-free panning and zooming.
 */

import type { TileLayer as LeafletTileLayer } from "leaflet";

export type LeafletModule = typeof import("leaflet");
export type LeafletMap   = import("leaflet").Map;

/** auto = roadmap with POIs | satellite | hybrid | terrain */
export type MapDisplayStyle = "auto" | "satellite" | "hybrid" | "terrain";

/** Google lyrs codes — roadmap (m) includes restaurants, mosques, hospitals, etc. */
const GOOGLE_LYRS: Record<MapDisplayStyle, string> = {
  auto:      "m",
  satellite: "s",
  hybrid:    "y",
  terrain:   "p",
};

const STYLE_CLASS: Record<MapDisplayStyle, string> = {
  auto:      "map-style-auto",
  satellite: "map-style-satellite",
  hybrid:    "map-style-hybrid",
  terrain:   "map-style-terrain",
};

/** Same paper colour as Google Maps so loading tiles never flash as a black square. */
const STYLE_FILL: Record<MapDisplayStyle, string> = {
  auto:      "#f2efe9",
  satellite: "#8d8680",
  hybrid:    "#8d8680",
  terrain:   "#e4dcc4",
};

/**
 * Performance-tuned tile options.
 *
 * Key smoothness settings:
 *   updateWhenIdle: true  → only fetch new tiles when panning STOPS  (biggest fix)
 *   updateWhenZooming: false → no tile requests mid-zoom
 *   updateInterval: 200   → throttle tile loading (not too aggressive)
 *   keepBuffer: 2         → smaller tile buffer = less memory/CPU overhead
 */
const TILE_OPTS = {
  maxZoom:            21,
  maxNativeZoom:      21,
  minZoom:            3,
  tileSize:           256,
  detectRetina:       false,
  updateWhenIdle:     true,    // ← main smoothness fix (was false)
  updateWhenZooming:  false,
  updateInterval:     200,     // ← less aggressive (was 40)
  keepBuffer:         2,       // ← smaller buffer (was 4)
  crossOrigin:        false as const,  // same-origin proxy → no CORS needed
} as const;

/** Proxy tile URL — routes through tabibee.com, same visual result as Google Maps */
function googleProxyUrl(lyrs: string, lang: "ar" | "en"): string {
  const hl = lang === "ar" ? "&hl=ar" : "&hl=en";
  return `/api/tiles/{z}/{x}/{y}.png?s=${lyrs}${hl}`;
}

function tileLang(locale: string): "ar" | "en" {
  return isArabicLocale(locale) ? "ar" : "en";
}

function markMapStyle(map: LeafletMap, style: MapDisplayStyle) {
  const container = map.getContainer();
  Object.values(STYLE_CLASS).forEach((c) => container.classList.remove(c));
  container.classList.add(STYLE_CLASS[style]);
  container.style.setProperty("background", STYLE_FILL[style], "important");
}

export function isArabicLocale(locale: string): boolean {
  return locale === "ar" || locale.startsWith("ar-");
}

/** Create a proxied Google Maps tile layer. Visual output = standard Google Maps. */
export function createGoogleTileLayer(
  L: LeafletModule,
  locale: string,
  style: MapDisplayStyle = "auto"
): LeafletTileLayer {
  const lang = tileLang(locale);
  const lyrs = GOOGLE_LYRS[style];
  const ar   = lang === "ar";

  return L.tileLayer(googleProxyUrl(lyrs, lang), {
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

/**
 * Leaflet map constructor defaults.
 *
 * Key smoothness settings:
 *   zoomSnap: 1        → whole zoom levels only (was 0.5 — caused choppy half-steps)
 *   zoomDelta: 1       → matches zoomSnap
 *   wheelPxPerZoomLevel: 60 → smoother wheel zoom (was 40 — too sensitive)
 *   wheelDebounceTime: 40  → debounce rapid scroll wheel
 *   preferCanvas: true → GPU canvas rendering instead of SVG
 *   fadeAnimation: true → smooth tile crossfade
 */
export const MAP_DEFAULTS = {
  maxZoom:             21,
  minZoom:             3,
  zoomSnap:            1,     // ← whole zoom levels (was 0.5)
  zoomDelta:           1,     // ← match zoomSnap (was 0.5)
  wheelPxPerZoomLevel: 60,    // ← smoother wheel zoom (was 40)
  wheelDebounceTime:   40,
  fadeAnimation:       true,  // ← smooth tile transitions (was false)
  zoomAnimation:       true,
  markerZoomAnimation: true,
  inertia:             true,
  inertiaDeceleration: 2000,
  easeLinearity:       0.2,
  preferCanvas:        true,  // ← GPU canvas rendering
} as const;

export const MAP_REFRESH_MS = 4_000;

export function getMapPreconnectHosts(_locale = "ar"): string[] {
  // Tiles go through the same-origin proxy — no external preconnect needed
  return [];
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
