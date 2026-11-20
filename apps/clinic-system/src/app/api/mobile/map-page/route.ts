import { IRAQ_GOVERNORATES } from "@/lib/iraq";
import { getPublicSpecialties } from "@/lib/publicDoctors";

export const dynamic = "force-dynamic";

function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function GET() {
  const specialties = await getPublicSpecialties();
  const govs = IRAQ_GOVERNORATES.map((g) => ({
    id: g.id,
    ar: g.ar,
    lat: g.lat,
    lng: g.lng,
    districts: g.districts.map((d) => ({
      id: d.id,
      ar: d.ar,
      lat: d.lat,
      lng: d.lng,
    })),
  }));

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<style>
  html, body { margin:0; height:100%; background:#f2efe9; font-family: Tahoma, "Segoe UI", sans-serif; }
  #map { position:absolute; inset:0; }
  .bar {
    position:absolute; top:8px; right:8px; left:8px; z-index:500;
    display:flex; flex-direction:column; gap:6px;
  }
  .row { display:flex; gap:6px; }
  select, input, button.tool {
    background:#fff; border:1px solid rgba(15,23,42,.12); border-radius:12px;
    padding:10px 12px; font-size:14px; color:#0f172a; box-shadow:0 4px 16px rgba(15,23,42,.08);
  }
  input { flex:1; min-width:0; }
  select { max-width:34%; }
  .tools { position:absolute; top:118px; left:8px; z-index:500; display:flex; flex-direction:column; gap:6px; }
  button.tool { width:44px; height:44px; padding:0; font-size:16px; }
  .sheet {
    position:absolute; left:8px; right:8px; bottom:8px; z-index:500;
    background:#fff; border-radius:18px; padding:14px;
    box-shadow:0 10px 30px rgba(15,23,42,.18); display:none;
  }
  .sheet h3 { margin:0 0 4px; font-size:17px; }
  .meta { color:#64748b; font-size:13px; margin:2px 0; }
  .actions { display:flex; gap:8px; margin-top:10px; }
  .actions button {
    flex:1; border:0; border-radius:12px; padding:11px 8px; font-size:14px; font-weight:700;
  }
  .primary { background:#6366f1; color:#fff; }
  .ghost { background:#eef2ff; color:#4338ca; }
  .pin { width:18px; height:18px; border-radius:50%; background:#6366f1; border:2px solid #fff;
    box-shadow:0 0 0 2px rgba(99,102,241,.35); }
  .pin.gov { background:#64748b; box-shadow:none; }
  .leaflet-control-attribution { font-size:10px; }
  #status { position:absolute; top:118px; right:8px; z-index:500; background:rgba(255,255,255,.92);
    border-radius:999px; padding:6px 10px; font-size:12px; color:#334155; }
</style>
</head>
<body>
<div id="map"></div>
<div class="bar">
  <div class="row">
    <select id="specialty"><option value="">كل التخصصات</option></select>
    <select id="gov"><option value="">كل المحافظات</option></select>
    <select id="district"><option value="">كل الأقضية</option></select>
  </div>
  <input id="q" placeholder="ابحث عن طبيب أو عنوان..." />
</div>
<div class="tools">
  <button class="tool" id="styleBtn" title="نمط الخريطة">🗺️</button>
  <button class="tool" id="locBtn" title="موقعي">📍</button>
</div>
<div id="status">جارٍ تحميل الخريطة...</div>
<div class="sheet" id="sheet">
  <h3 id="sName"></h3>
  <div class="meta" id="sSpec"></div>
  <div class="meta" id="sAddr"></div>
  <div class="meta" id="sHours"></div>
  <div class="meta" id="sFee"></div>
  <div class="actions">
    <button class="primary" id="openBtn">الملف</button>
    <button class="primary" id="bookBtn">احجز</button>
    <button class="ghost" id="callBtn">اتصال</button>
  </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
const GOVS = ${jsonForScript(govs)};
const SPECS = ${jsonForScript(specialties.map((s) => ({ id: s.id, nameAr: s.nameAr })))};
const params = new URLSearchParams(location.search);
let style = "m";
let map, layer, markers = [];
let selected = null;

function post(msg) {
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
}
function zoomFor(km) {
  if (!km) return 11;
  if (km <= 5) return 14;
  if (km <= 8) return 13;
  if (km <= 15) return 12;
  if (km <= 25) return 11;
  if (km <= 40) return 10;
  return 9;
}
function fillSelects() {
  const spec = document.getElementById("specialty");
  SPECS.forEach((s) => {
    const o = document.createElement("option");
    o.value = s.id; o.textContent = s.nameAr; spec.appendChild(o);
  });
  const gov = document.getElementById("gov");
  GOVS.forEach((g) => {
    const o = document.createElement("option");
    o.value = g.id; o.textContent = g.ar; gov.appendChild(o);
  });
  if (params.get("specialty")) spec.value = params.get("specialty");
  if (params.get("gov")) gov.value = params.get("gov");
  fillDistricts();
  if (params.get("district")) document.getElementById("district").value = params.get("district");
  if (params.get("q")) document.getElementById("q").value = params.get("q");
}
function fillDistricts() {
  const govId = document.getElementById("gov").value;
  const district = document.getElementById("district");
  const current = district.value;
  district.innerHTML = '<option value="">كل الأقضية</option>';
  const g = GOVS.find((x) => x.id === govId);
  (g ? g.districts : []).forEach((d) => {
    const o = document.createElement("option");
    o.value = d.id; o.textContent = d.ar; district.appendChild(o);
  });
  if ([...district.options].some((o) => o.value === current)) district.value = current;
}
function setTiles() {
  if (layer) map.removeLayer(layer);
  const url = style === "s"
    ? "https://mt{s}.google.com/vt/lyrs=y&hl=ar&gl=IQ&x={x}&y={y}&z={z}"
    : "https://mt{s}.google.com/vt/lyrs=m&hl=ar&gl=IQ&x={x}&y={y}&z={z}";
  layer = L.tileLayer(url, { subdomains: "0123", maxZoom: 20, attribution: "&copy; Google" });
  layer.addTo(map);
  let fails = 0;
  layer.on("tileerror", function () {
    fails++;
    if (fails === 6 && !map._osm) {
      map._osm = true;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    }
  });
}
function focus() {
  const pinLat = parseFloat(params.get("lat") || "");
  const pinLng = parseFloat(params.get("lng") || "");
  if (!Number.isNaN(pinLat) && !Number.isNaN(pinLng)) {
    map.setView([pinLat, pinLng], 15);
    return;
  }
  const govId = document.getElementById("gov").value;
  const distId = document.getElementById("district").value;
  const g = GOVS.find((x) => x.id === govId);
  if (g && distId) {
    const d = g.districts.find((x) => x.id === distId);
    if (d) { map.setView([d.lat, d.lng], 12); return; }
  }
  if (g) { map.setView([g.lat, g.lng], 9); return; }
  map.setView([33.3, 44.4], 6);
}
function draw(pins) {
  markers.forEach((m) => map.removeLayer(m));
  markers = [];
  pins.forEach((pin) => {
    const lat = pin.lat || pin.govLat;
    const lng = pin.lng || pin.govLng;
    if (!lat || !lng) return;
    const exact = !!(pin.lat && pin.lng);
    const icon = L.divIcon({
      className: "",
      html: '<div class="pin' + (exact ? "" : " gov") + '"></div>',
      iconSize: [18, 18], iconAnchor: [9, 9]
    });
    const marker = L.marker([lat, lng], { icon }).addTo(map);
    marker.on("click", () => showSheet(pin));
    markers.push(marker);
  });
  document.getElementById("status").textContent = pins.length + " طبيب";
  if (params.get("lat") && params.get("lng")) {
    const only = pins.find((p) => String(p.lat) === params.get("lat"));
    if (only) showSheet(only);
  }
}
async function loadPins() {
  const q = new URLSearchParams();
  const specialty = document.getElementById("specialty").value;
  const gov = document.getElementById("gov").value;
  const district = document.getElementById("district").value;
  const text = document.getElementById("q").value.trim();
  if (specialty) q.set("specialty", specialty);
  if (gov) q.set("gov", gov);
  if (district) q.set("district", district);
  if (text) q.set("q", text);
  document.getElementById("status").textContent = "جارٍ البحث...";
  try {
    const res = await fetch("/api/mobile/patient/map?" + q.toString());
    const pins = await res.json();
    draw(Array.isArray(pins) ? pins : []);
    focus();
  } catch (e) {
    document.getElementById("status").textContent = "تعذر تحميل الأطباء";
  }
}
function showSheet(pin) {
  selected = pin;
  document.getElementById("sName").textContent = pin.nameAr || pin.name || "";
  document.getElementById("sSpec").textContent = pin.specialtyAr || "";
  document.getElementById("sAddr").textContent = pin.clinicAddress ? "📍 " + pin.clinicAddress : "";
  const hours = [pin.workingHoursStart, pin.workingHoursEnd].filter(Boolean).join(" - ");
  document.getElementById("sHours").textContent = hours ? "🕒 " + hours : "";
  document.getElementById("sFee").textContent = pin.showConsultationFee && pin.consultationFee
    ? "💰 " + Number(pin.consultationFee).toLocaleString("ar-IQ") + " د.ع"
    : "";
  document.getElementById("callBtn").style.display = pin.phone ? "block" : "none";
  document.getElementById("sheet").style.display = "block";
  if (pin.lat && pin.lng) map.panTo([pin.lat, pin.lng]);
}
function boot() {
  if (typeof L === "undefined") {
    document.getElementById("status").textContent = "تعذر تحميل مكتبة الخريطة. تحقق من الإنترنت.";
    return;
  }
  map = L.map("map", { zoomControl: false, attributionControl: true }).setView([33.3, 44.4], 6);
  setTiles();
  fillSelects();
  focus();
  loadPins();
  document.getElementById("gov").addEventListener("change", () => { fillDistricts(); loadPins(); });
  ["specialty", "district"].forEach((id) => document.getElementById(id).addEventListener("change", loadPins));
  let timer;
  document.getElementById("q").addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(loadPins, 400);
  });
  document.getElementById("styleBtn").onclick = () => { style = style === "m" ? "s" : "m"; map._osm = false; setTiles(); };
  document.getElementById("locBtn").onclick = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      map.setView([pos.coords.latitude, pos.coords.longitude], 13);
    });
  };
  document.getElementById("openBtn").onclick = () => selected && post({ type: "openDoctor", id: selected.id });
  document.getElementById("bookBtn").onclick = () => selected && post({ type: "bookDoctor", id: selected.id });
  document.getElementById("callBtn").onclick = () => selected && selected.phone && post({ type: "call", phone: selected.phone });
  map.on("click", () => { document.getElementById("sheet").style.display = "none"; });
  setTimeout(() => map.invalidateSize(), 300);
}
window.addEventListener("load", boot);
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=120",
    },
  });
}
