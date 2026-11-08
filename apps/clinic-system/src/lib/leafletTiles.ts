/** Google Maps tiles for Leaflet, refreshed on a timer so the view stays current. */

import type { TileLayer as LeafletTileLayer } from "leaflet";

export type LeafletModule = typeof import("leaflet");
export type LeafletMap = import("leaflet").Map;

/** auto = roadmap with POIs | satellite | hybrid | terrain */
export type MapDisplayStyle = "auto" | "satellite" | "hybrid" | "terrain";

/** Live list of tile layers. Refresh reads `.current` so a style change stays on Google. */
export type TileLayerBag = { current: LeafletTileLayer[] };

/** Google lyrs codes — roadmap (m) includes restaurants, mosques, hospitals, etc. */
const GOOGLE_LYRS: Record<MapDisplayStyle, string> = {
  auto: "m",
  satellite: "s",
  hybrid: "y",
  terrain: "p",
};

const TILE_OPTS = {
  subdomains: "0123",
  maxZoom: 21,
  maxNativeZoom: 21,
  detectRetina: false,
  updateWhenIdle: false,
  updateWhenZooming: true,
  keepBuffer: 4,
  crossOrigin: true as const,
};

const layerMeta = new WeakMap<LeafletTileLayer, { locale: string; style: MapDisplayStyle }>();

function getGoogleMapsKey(): string | undefined {
  const key =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()
      : undefined;
  return key || undefined;
}

export function isArabicLocale(locale: string): boolean {
  return locale === "ar" || locale.startsWith("ar-");
}

function googleTileUrl(lyrs: string, lang: "ar" | "en", version: number): string {
  const key = getGoogleMapsKey();
  const params = [
    `lyrs=${lyrs}`,
    "x={x}",
    "y={y}",
    "z={z}",
    `hl=${lang}`,
    "gl=IQ",
    key ? `key=${key}` : "",
    `v=${version}`,
  ]
    .filter(Boolean)
    .join("&");
  return `https://mt{s}.google.com/vt?${params}`;
}

function tileLang(locale: string): "ar" | "en" {
  return isArabicLocale(locale) ? "ar" : "en";
}

/** Create a Google Maps tile layer. `version` changes the URL so the browser fetches fresh tiles. */
export function createGoogleTileLayer(
  L: LeafletModule,
  locale: string,
  style: MapDisplayStyle = "auto",
  version = Date.now()
): LeafletTileLayer {
  const lang = tileLang(locale);
  const lyrs = GOOGLE_LYRS[style];
  const ar = lang === "ar";

  const layer = L.tileLayer(googleTileUrl(lyrs, lang, version), {
    ...TILE_OPTS,
    attribution: ar
      ? '&copy; <a href="https://www.google.com/maps">خرائط Google</a>'
      : '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
  });
  layerMeta.set(layer, { locale, style });
  return layer;
}

/** Replace the base map with a Google layer for the chosen style. */
export function setMapDisplayStyle(
  map: LeafletMap,
  currentLayers: LeafletTileLayer[],
  L: LeafletModule,
  locale: string,
  style: MapDisplayStyle
): LeafletTileLayer[] {
  currentLayers.forEach((layer) => {
    if (map.hasLayer(layer)) map.removeLayer(layer);
  });

  const layer = createGoogleTileLayer(L, locale, style);
  layer.addTo(map);
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
  zoomSnap: 0.5,
  zoomDelta: 0.5,
  wheelPxPerZoomLevel: 80,
  fadeAnimation: false,
  zoomAnimation: true,
  markerZoomAnimation: false,
} as const;

export const MAP_REFRESH_MS = 20_000;
/** How often visible Google tiles are requested again. */
export const MAP_TILE_REDRAW_MS = 45_000;

/**
 * Keep asking Google for the current tiles. Reads `layers.current` on every
 * tick, so switching roadmap / satellite / hybrid does not freeze the source.
 */
export function startMapTileRefresh(
  map: LeafletMap,
  layers: TileLayerBag,
  intervalMs = MAP_TILE_REDRAW_MS,
  delayMs = 8_000
): () => void {
  let intervalId: number | undefined;

  const tick = () => {
    if (!map.getContainer()?.isConnected) return;
    const version = Date.now();
    layers.current.forEach((layer) => {
      const meta = layerMeta.get(layer);
      if (!meta || !map.hasLayer(layer)) return;
      try {
        layer.setUrl(googleTileUrl(GOOGLE_LYRS[meta.style], tileLang(meta.locale), version));
      } catch {
        // map may be tearing down
      }
    });
  };

  const timeoutId = window.setTimeout(() => {
    intervalId = window.setInterval(tick, intervalMs);
  }, delayMs);

  return () => {
    window.clearTimeout(timeoutId);
    if (intervalId !== undefined) window.clearInterval(intervalId);
  };
}

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
