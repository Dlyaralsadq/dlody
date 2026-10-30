"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Phone, Calendar, X, Navigation, MapPin, Clock, Banknote, Locate } from "lucide-react";

export interface FocusArea {
  lat: number;
  lng: number;
  zoom: number;
  radiusKm?: number;
  label?: string;
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
  specialtyIcon: string;
}

const IRAQ_CENTER: [number, number] = [33.2, 44.0];
const IRAQ_ZOOM = 6;

export default function PatientMapView({
  doctors,
  locale,
  focusArea,
}: {
  doctors: DoctorPin[];
  locale: string;
  focusArea?: FocusArea | null;
}) {
  const ar = locale === "ar";
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const areaCircleRef = useRef<any>(null);
  const [selected, setSelected] = useState<DoctorPin | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);

  // Build map once (guard against React Strict Mode double-mount)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css" as any);

      if (cancelled || !containerRef.current || mapRef.current) return;

      const el = containerRef.current;
      if ((el as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;

      const map = L.map(el, {
        center: IRAQ_CENTER,
        zoom: IRAQ_ZOOM,
        zoomControl: false,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      if (cancelled) {
        map.remove();
        return;
      }

      mapRef.current = map;
      renderMarkers(L, map);
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers when doctors change
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L: any) => {
      renderMarkers(L, mapRef.current);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors.length]);

  // Fly to focusArea when district/gov selected
  useEffect(() => {
    if (!mapRef.current || !focusArea) return;
    const map = mapRef.current;

    // Remove previous area circle
    if (areaCircleRef.current) {
      areaCircleRef.current.remove();
      areaCircleRef.current = null;
    }

    map.flyTo([focusArea.lat, focusArea.lng], focusArea.zoom, {
      animate: true,
      duration: 1.2,
    });

    if (focusArea.radiusKm) {
      import("leaflet").then((L: any) => {
        const circle = L.circle([focusArea.lat, focusArea.lng], {
          radius: focusArea.radiusKm! * 1000,
          color: "#6366f1",
          weight: 2,
          opacity: 0.8,
          fillColor: "#6366f1",
          fillOpacity: 0.08,
          dashArray: "6 4",
        }).addTo(map);
        if (focusArea.label) {
          circle.bindTooltip(focusArea.label, {
            permanent: true,
            direction: "center",
            className: "district-tooltip",
          }).openTooltip();
        }
        areaCircleRef.current = circle;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusArea?.lat, focusArea?.lng, focusArea?.zoom]);

  function renderMarkers(L: any, map: any) {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    doctors.forEach((doc) => {
      const lat = doc.lat ?? doc.govLat;
      const lng = doc.lng ?? doc.govLng;
      const exact = doc.lat !== null && doc.lng !== null;

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
              box-shadow:0 2px 12px rgba(99,102,241,0.5);
            ">${doc.specialtyIcon}</div>
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
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(latlng);
        setLocating(false);
        if (mapRef.current) {
          mapRef.current.flyTo(latlng, 13, { animate: true, duration: 1.2 });
          import("leaflet").then((L: any) => {
            L.circleMarker(latlng, {
              radius: 10,
              fillColor: "#22d3ee",
              fillOpacity: 0.8,
              color: "#fff",
              weight: 2,
            }).addTo(mapRef.current).bindPopup(ar ? "موقعك الحالي" : "Your location");
          });
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [ar]);

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

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Locate me button */}
      <button
        onClick={locateMe}
        disabled={locating}
        className="absolute top-4 start-4 z-[1000] flex items-center gap-2 rounded-xl border border-white/20 bg-[#060912]/90 backdrop-blur px-3 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-indigo-600/80 transition disabled:opacity-60"
      >
        {locating ? (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : (
          <Locate size={14} />
        )}
        {ar ? "موقعي" : "My location"}
      </button>

      {/* Legend */}
      <div className="absolute bottom-36 start-3 z-[1000] rounded-xl border border-white/10 bg-[#060912]/85 backdrop-blur p-2.5 text-[10px] text-white/50 space-y-1.5">
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
        <div className="absolute bottom-0 inset-x-0 z-[1001] animate-slide-up">
          <div className="mx-auto max-w-lg">
            <div className="rounded-t-3xl border-t border-x border-white/10 bg-[#0c1121]/95 backdrop-blur-md p-5">
              {/* Handle bar */}
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600/80 to-violet-700/80 text-2xl border border-white/5">
                    {selected.specialtyIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-white text-base leading-tight truncate">
                      {ar ? selected.nameAr : selected.name}
                    </h3>
                    <p className="text-xs text-indigo-400 mt-0.5">
                      {ar ? selected.specialtyAr : selected.specialtyEn}
                    </p>
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

              {/* Info row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {selected.clinicAddress && (
                  <div className="col-span-3 flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2">
                    <MapPin size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-white/70 leading-relaxed">{selected.clinicAddress}</p>
                  </div>
                )}
                {hours && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2">
                    <Clock size={12} className="text-violet-400 shrink-0" />
                    <p className="text-[11px] text-white/60">{hours}</p>
                  </div>
                )}
                {selected.consultationFee != null && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2">
                    <Banknote size={12} className="text-emerald-400 shrink-0" />
                    <p className="text-[11px] font-semibold text-emerald-400">
                      {selected.consultationFee.toLocaleString()} {ar ? "د.ع" : "IQD"}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => flyToDoctor(selected)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/20 px-3 py-2 hover:bg-indigo-500/25 transition"
                >
                  <Navigation size={12} className="text-indigo-400 shrink-0" />
                  <p className="text-[11px] text-indigo-300">{ar ? "تكبير" : "Zoom in"}</p>
                </button>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                {selected.phone ? (
                  <a
                    href={`tel:${selected.phone}`}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 py-3 text-sm font-bold text-cyan-300 hover:bg-cyan-500/20 transition"
                  >
                    <Phone size={14} />
                    {ar ? "اتصل بالعيادة" : "Call clinic"}
                  </a>
                ) : (
                  <div />
                )}
                <Link
                  href={`/${locale}/patient/doctor/${selected.id}`}
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
