"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Phone, Calendar, X, Navigation, MapPin, Clock, Banknote, Locate, Star, User, Rss } from "lucide-react";
import { WORKING_DAYS_LABELS } from "@/lib/doctorDisplay";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import { DoctorRatingBadge } from "@/components/ui/DoctorRatingDisplay";
import { applyHighQualityTiles, MAP_DEFAULTS, MAP_REFRESH_MS, setMapDisplayStyle, type MapDisplayStyle } from "@/lib/leafletTiles";
import { loadLeafletMap } from "@/lib/leafletLoader";
import { fetchMapDoctorPins } from "@/app/actions/patientMap";
import { PATIENT_NAV_BOTTOM_OFFSET, PATIENT_NAV_LEGEND_OFFSET } from "@/lib/patientUi";
import MapStyleSwitcher from "@/components/ui/MapStyleSwitcher";

export interface FocusArea {
  lat: number;
  lng: number;
  zoom: number;
  radiusKm?: number;
  label?: string;
  govId?: string;
  districtId?: string;
  /** Ordered place-name queries. The map draws an administrative polygon only. */
  searchQueries?: string[];
  /** Names that must appear in the boundary's own title, not a parent area. */
  matchNames?: string[];
}

export interface DoctorPin {
  id: string;
  nameAr: string;
  name: string;
  specialtyId: string;
  specialtyAr: string;
  specialtyEn: string;
  lat: number | null;
  lng: number | null;
  govLat: number;
  govLng: number;
  clinicAddress: string | null;
  phone: string | null;
  consultationFee: number | null;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  workingDays: string | null;
  experienceYears: number | null;
  bio: string | null;
  bioAr: string | null;
  logoUrl: string | null;
  showConsultationFee: boolean;
  specialtyIcon: string;
  ratingAverage: number;
  ratingCount: number;
  hasActiveStory: boolean;
}

const IRAQ_CENTER: [number, number] = [33.2, 44.0];
const IRAQ_ZOOM = 6;

export default function PatientMapView({
  doctors: initialDoctors,
  locale,
  focusArea,
  mapFilters,
  hasFilter = false,
}: {
  doctors: DoctorPin[];
  locale: string;
  focusArea?: FocusArea | null;
  mapFilters?: { specialty?: string; gov?: string; district?: string; q?: string };
  hasFilter?: boolean;
}) {
  const ar = locale === "ar";
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const areaCircleRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const firstLocateRef = useRef(true);
  const tileLayersRef = useRef<import("leaflet").TileLayer[]>([]);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const [mapStyle, setMapStyle] = useState<MapDisplayStyle>("auto");
  const [doctors, setDoctors] = useState(initialDoctors);
  const [selected, setSelected] = useState<DoctorPin | null>(null);
  const [locating, setLocating] = useState(false);
  const selectedIdRef = useRef<string | null>(null);
  const markerKeyRef = useRef("");

  useEffect(() => {
    selectedIdRef.current = selected?.id ?? null;
  }, [selected]);

  useEffect(() => {
    setDoctors(initialDoctors);
  }, [initialDoctors]);

  // Auto-refresh doctor pins (only when at least one filter is active)
  useEffect(() => {
    if (!mapFilters || !hasFilter) return;
    const refresh = async () => {
      try {
        const fresh = await fetchMapDoctorPins(mapFilters);
        setDoctors(fresh);
        const id = selectedIdRef.current;
        if (id) {
          const updated = fresh.find((d) => d.id === id);
          if (updated) setSelected(updated);
        }
      } catch {
        // ignore transient errors
      }
    };
    const interval = setInterval(refresh, MAP_REFRESH_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapFilters, hasFilter]);

  // Build map once (guard against React Strict Mode double-mount)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    (async () => {
      const L = await loadLeafletMap();

      if (cancelled || !containerRef.current || mapRef.current) return;

      const el = containerRef.current;
      if ((el as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;

      const map = L.map(el, {
        center: IRAQ_CENTER,
        zoom: IRAQ_ZOOM,
        zoomControl: false,
        attributionControl: true,
        ...MAP_DEFAULTS,
      });

      tileLayersRef.current = applyHighQualityTiles(L, map, locale, mapStyle);
      leafletRef.current = L;

      L.control.zoom({ position: "bottomright" }).addTo(map);

      if (cancelled) {
        map.remove();
        return;
      }

      mapRef.current = map;
      map.whenReady(() => {
        if (!cancelled) renderMarkers(L, map);
      });
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (areaCircleRef.current) {
        areaCircleRef.current.remove();
        areaCircleRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      tileLayersRef.current = [];
      leafletRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

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

  // Re-render markers only when a pin actually changed, so the refresh stays smooth.
  useEffect(() => {
    if (!mapRef.current) return;
    const key = doctors
      .map((d) => `${d.id}|${d.lat ?? ""}|${d.lng ?? ""}|${d.logoUrl ?? ""}|${d.specialtyIcon}|${d.hasActiveStory ? 1 : 0}`)
      .join(";");
    if (key === markerKeyRef.current) return;
    markerKeyRef.current = key;
    import("leaflet").then((L: any) => {
      if (!mapRef.current) return;
      renderMarkers(L, mapRef.current);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors]);

  // Fly to focusArea and draw real GeoJSON boundary from Nominatim
  useEffect(() => {
    if (!mapRef.current || !focusArea) return;
    const map = mapRef.current;
    let cancelled = false;

    // Remove previous boundary layer
    if (areaCircleRef.current) {
      areaCircleRef.current.remove?.();
      areaCircleRef.current = null;
    }

    // Fly to center immediately for instant feedback
    map.flyTo([focusArea.lat, focusArea.lng], focusArea.zoom, {
      animate: true,
      duration: 1.0,
    });

    const queries = focusArea.searchQueries?.filter(Boolean) ?? [];
    if (queries.length === 0) return;

    const renderGeoJSON = async (geojson: object) => {
      const L = await import("leaflet" as any);
      if (cancelled || !mapRef.current) return;

      const geoLayer = (L as any).geoJSON(geojson, {
        style: {
          color: "#6366f1",
          weight: 2.5,
          opacity: 0.95,
          fillColor: "#818cf8",
          fillOpacity: 0.10,
          dashArray: "6 4",
        },
      }).addTo(map);

      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], animate: true, duration: 1.0, maxZoom: 14 });
      }

      if (focusArea!.label) {
        geoLayer.bindTooltip(focusArea!.label, {
          permanent: true,
          direction: "center",
          className: "district-tooltip",
        }).openTooltip();
      }

      areaCircleRef.current = geoLayer;
    };

    const fetchBoundary = async () => {
      try {
        const res = await fetch("/api/area-boundary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            govId: focusArea!.govId,
            districtId: focusArea!.districtId,
            queries,
            match: focusArea!.matchNames ?? [],
          }),
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { geojson?: object | null };
        if (cancelled || !data.geojson) return;
        await renderGeoJSON(data.geojson);
      } catch {
        // No outline when the boundary service is unavailable. Never draw a circle.
      }
    };

    fetchBoundary();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusArea?.govId, focusArea?.districtId, focusArea?.searchQueries?.join("|"), focusArea?.matchNames?.join("|"), focusArea?.lat, focusArea?.lng, focusArea?.zoom]);

  function renderMarkers(L: any, map: any) {
    markerKeyRef.current = doctors
      .map((d) => `${d.id}|${d.lat ?? ""}|${d.lng ?? ""}|${d.logoUrl ?? ""}|${d.specialtyIcon}|${d.hasActiveStory ? 1 : 0}`)
      .join(";");
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    doctors.forEach((doc) => {
      const lat = doc.lat ?? doc.govLat;
      const lng = doc.lng ?? doc.govLng;
      const exact = doc.lat !== null && doc.lng !== null;

      const markerInner = doc.logoUrl
        ? `<img src="${doc.logoUrl.replace(/"/g, "&quot;")}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="" />`
        : doc.specialtyIcon;

      const icon = L.divIcon({
        className: "",
        html: `
          <div style="
            position:relative;
            display:flex;
            flex-direction:column;
            align-items:center;
            cursor:pointer;
          ">
            <div style="
              background:${exact ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "linear-gradient(135deg,#475569,#64748b)"};
              border:2px solid ${exact ? "#818cf8" : "#94a3b8"};
              border-radius:50%;
              width:38px;height:38px;
              display:flex;align-items:center;justify-content:center;
              font-size:18px;
              overflow:hidden;
              box-shadow:0 2px 12px rgba(99,102,241,0.5);
            ">${markerInner}</div>
            <div style="
              width:0;height:0;
              border-left:6px solid transparent;
              border-right:6px solid transparent;
              border-top:8px solid ${exact ? "#6366f1" : "#475569"};
              margin-top:-1px;
            "></div>
          </div>`,
        iconSize: [38, 48],
        iconAnchor: [19, 48],
        popupAnchor: [0, -50],
      });

      const marker = L.marker([lat, lng], { icon });
      marker.on("click", () => {
        setSelected(doc);
        map.panTo([lat, lng], { animate: true });
      });
      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    firstLocateRef.current = true;

    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const updatePosition = (pos: GeolocationPosition) => {
      const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      setLocating(false);

      if (mapRef.current) {
        if (firstLocateRef.current) {
          mapRef.current.flyTo(latlng, 15, { animate: true, duration: 1.2 });
          firstLocateRef.current = false;
        }
        import("leaflet").then((L: any) => {
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(latlng);
          } else {
            userMarkerRef.current = L.circleMarker(latlng, {
              radius: 10,
              fillColor: "#22d3ee",
              fillOpacity: 0.85,
              color: "#fff",
              weight: 2,
            })
              .addTo(mapRef.current)
              .bindPopup(ar ? "موقعك الحالي" : "Your location");
          }
        });
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      updatePosition,
      () => setLocating(false),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }, [ar]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const flyToDoctor = useCallback((doc: DoctorPin) => {
    if (!mapRef.current) return;
    const lat = doc.lat ?? doc.govLat;
    const lng = doc.lng ?? doc.govLng;
    mapRef.current.flyTo([lat, lng], doc.lat ? 16 : 10, { animate: true, duration: 1 });
  }, []);

  const hours =
    selected?.workingHoursStart && selected?.workingHoursEnd
      ? `${selected.workingHoursStart} – ${selected.workingHoursEnd}`
      : null;

  const daysLabel =
    selected?.workingDays && WORKING_DAYS_LABELS[selected.workingDays]
      ? (ar ? WORKING_DAYS_LABELS[selected.workingDays].ar : WORKING_DAYS_LABELS[selected.workingDays].en)
      : null;

  const bioText = selected
    ? (ar ? (selected.bioAr ?? selected.bio) : (selected.bio ?? selected.bioAr))
    : null;

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* ── No-filter hint overlay ── */}
      {!hasFilter && (
        <div
          className="absolute inset-x-0 z-[1001] flex flex-col items-center justify-center gap-3 pointer-events-none"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <div
            className="mx-4 flex flex-col items-center gap-3 rounded-2xl px-5 py-4 text-center pointer-events-none"
            style={{
              background: "rgba(6,9,18,.82)",
              border: "1px solid rgba(99,102,241,.25)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              maxWidth: "22rem",
            }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)" }}
            >
              <MapPin size={20} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-1">
                {ar ? "اختر المحافظة والتخصص" : "Select governorate & specialty"}
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,.45)" }}>
                {ar
                  ? "استخدم شريط الفلاتر أعلاه لتحديد المنطقة والتخصص وستظهر الأطباء على الخريطة"
                  : "Use the filter bar above to pick a region and specialty — doctors will appear on the map"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live refresh indicator */}
      {mapFilters && hasFilter && (
        <div className="absolute top-4 end-4 z-[1000] flex items-center gap-1.5 rounded-xl backdrop-blur px-2.5 py-1.5 text-[10px]" style={{ border: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg-root) 90%, transparent)", color: "var(--text-3)" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {ar ? "تحديث مباشر" : "Live"}
        </div>
      )}

      {/* Locate me button */}
      <button
        onClick={locateMe}
        disabled={locating}
        className="absolute top-4 start-4 z-[1000] flex items-center gap-2 rounded-xl backdrop-blur px-3 py-2.5 text-xs font-semibold shadow-lg hover:bg-indigo-600/80 transition disabled:opacity-60"
        style={{ border: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg-root) 90%, transparent)", color: "var(--text-1)" }}
      >
        {locating ? (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : (
          <Locate size={14} />
        )}
        {ar ? "موقعي" : "My location"}
      </button>

      {/* Map style switcher */}
      <MapStyleSwitcher
        value={mapStyle}
        onChange={setMapStyle}
        locale={locale}
        className="absolute top-[4.25rem] start-4 z-[1000]"
      />

      {/* Legend */}
      <div className={`absolute start-3 z-[999] rounded-xl backdrop-blur p-2.5 text-[10px] space-y-1.5 ${PATIENT_NAV_LEGEND_OFFSET}`} style={{ border: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg-root) 88%, transparent)", color: "var(--text-3)" }}>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 border border-indigo-400/50" />
          {ar ? "موقع دقيق" : "Exact location"}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 border border-slate-400/50" />
          {ar ? "مركز المحافظة" : "Governorate center"}
        </div>
      </div>

      {/* Doctor info panel — slides up from bottom */}
      {selected && (
        <div className={`absolute inset-x-0 z-[1000] animate-slide-up max-h-[calc(85vh-4rem)] overflow-y-auto ${PATIENT_NAV_BOTTOM_OFFSET}`}>
          <div className="mx-auto max-w-lg">
            <div className="rounded-t-3xl border-t border-x border-white/10 bg-[#0c1121]/98 backdrop-blur-md p-5 pb-6">
              {/* Handle bar */}
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <DoctorAvatar
                    logoUrl={selected.logoUrl}
                    specialtyId={selected.specialtyId}
                    size="lg"
                    round
                    hasStory={selected.hasActiveStory}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-white text-base leading-tight">
                      {ar ? selected.nameAr : selected.name}
                    </h3>
                    <p className="text-xs text-indigo-400 mt-0.5">
                      {ar ? selected.specialtyAr : selected.specialtyEn}
                    </p>
                    <DoctorRatingBadge
                      average={selected.ratingAverage}
                      count={selected.ratingCount}
                      locale={locale}
                      size="sm"
                      className="mt-1.5"
                    />
                    {selected.experienceYears != null && selected.experienceYears > 0 && (
                      <p className="flex items-center gap-1 text-[11px] text-white/45 mt-1">
                        <Star size={10} className="text-amber-400" />
                        {selected.experienceYears} {ar ? "سنة خبرة" : "years experience"}
                      </p>
                    )}
                    {(selected.lat === null) && (
                      <p className="text-[10px] text-amber-400/70 mt-0.5">
                        {ar ? "الموقع تقريبي — مركز المحافظة" : "Approximate location — governorate center"}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-white/8 text-white/50 hover:text-white hover:bg-white/15 transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Bio */}
              {bioText && (
                <div className="mb-4 rounded-xl bg-white/4 border border-white/6 px-3 py-3">
                  <p className="text-[10px] text-white/30 mb-1">{ar ? "نبذة تعريفية" : "About"}</p>
                  <p className="text-xs text-white/65 leading-relaxed line-clamp-4">{bioText}</p>
                </div>
              )}

              {/* Info grid */}
              <div className="space-y-2 mb-4">
                {selected.clinicAddress && (
                  <div className="flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2.5">
                    <MapPin size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-white/70 leading-relaxed">{selected.clinicAddress}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {(hours || daysLabel) && (
                    <div className="col-span-2 flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2.5">
                      <Clock size={12} className="text-violet-400 shrink-0 mt-0.5" />
                      <div>
                        {daysLabel && <p className="text-[11px] text-white/70">{daysLabel}</p>}
                        {hours && <p className="text-[11px] text-white/50">{hours}</p>}
                      </div>
                    </div>
                  )}
                  {selected.showConsultationFee && selected.consultationFee != null && (
                    <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15 px-3 py-2.5">
                      <Banknote size={12} className="text-emerald-400 shrink-0" />
                      <p className="text-[11px] font-semibold text-emerald-400">
                        {selected.consultationFee.toLocaleString()} {ar ? "د.ع" : "IQD"}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => flyToDoctor(selected)}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/20 px-3 py-2.5 hover:bg-indigo-500/25 transition"
                  >
                    <Navigation size={12} className="text-indigo-400 shrink-0" />
                    <p className="text-[11px] text-indigo-300">{ar ? "تكبير على الخريطة" : "Zoom on map"}</p>
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/${locale}/patient/doctor/${selected.id}?tab=info`}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
                >
                  <User size={14} />
                  {ar ? "معلومات العيادة" : "Clinic info"}
                </Link>
                <Link
                  href={`/${locale}/patient/doctor/${selected.id}`}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/25 bg-indigo-500/10 py-3 text-sm font-bold text-indigo-300 hover:bg-indigo-500/20 transition"
                >
                  <Rss size={14} />
                  {ar ? "المنشورات" : "Posts"}
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {selected.phone ? (
                  <a
                    href={`tel:${selected.phone}`}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 py-3 text-sm font-bold text-cyan-300 hover:bg-cyan-500/20 transition"
                  >
                    <Phone size={14} />
                    {ar ? "اتصل" : "Call"}
                  </a>
                ) : (
                  <div />
                )}
                <Link
                  href={`/${locale}/patient/book/${selected.id}`}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-950/50 hover:opacity-90 transition"
                >
                  <Calendar size={14} />
                  {ar ? "احجز موعد" : "Book now"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
