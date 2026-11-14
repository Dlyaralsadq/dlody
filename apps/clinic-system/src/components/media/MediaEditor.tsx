"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Check,
  RotateCw,
  FlipHorizontal,
  Type,
  Wand2,
  Palette,
  Crop,
  Trash2,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";

type Aspect = "free" | "1:1" | "4:5" | "16:9";

type FilterKey = "normal" | "bw" | "vintage" | "warm" | "cool" | "bright" | "dramatic";

type TextOverlay = {
  id: string;
  text: string;
  xPct: number;
  yPct: number;
  color: string;
  size: "sm" | "md" | "lg";
};

const FILTERS: Record<FilterKey, string> = {
  normal: "none",
  bw: "grayscale(1) contrast(1.08)",
  vintage: "sepia(0.35) contrast(0.92) brightness(1.05) saturate(0.8)",
  warm: "sepia(0.22) saturate(1.35) brightness(1.06)",
  cool: "saturate(1.15) brightness(1.03) hue-rotate(-8deg) contrast(1.03)",
  bright: "brightness(1.16) contrast(1.05) saturate(1.05)",
  dramatic: "contrast(1.35) brightness(0.94) saturate(1.15)",
};

const FILTER_LABELS: Record<FilterKey, { ar: string; en: string }> = {
  normal: { ar: "طبيعي", en: "Normal" },
  bw: { ar: "أبيض وأسود", en: "B&W" },
  vintage: { ar: "قديم", en: "Vintage" },
  warm: { ar: "دافئ", en: "Warm" },
  cool: { ar: "بارد", en: "Cool" },
  bright: { ar: "مشرق", en: "Bright" },
  dramatic: { ar: "درامي", en: "Dramatic" },
};

const ASPECTS: { id: Aspect; label: string; ratio: number | null }[] = [
  { id: "free", label: "Free", ratio: null },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "4:5", label: "4:5", ratio: 4 / 5 },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
];

const FRAME_COLORS: { id: string; color: string | null }[] = [
  { id: "none", color: null },
  { id: "white", color: "#ffffff" },
  { id: "black", color: "#0a0a0a" },
  { id: "sky", color: "#0ea5e9" },
  { id: "amber", color: "#f59e0b" },
  { id: "violet", color: "#7c3aed" },
];

const TEXT_COLORS = ["#ffffff", "#0a0a0a", "#fbbf24", "#f472b6", "#38bdf8", "#34d399"];

const TEMPLATES: {
  id: string;
  label: { ar: string; en: string };
  filter: FilterKey;
  frame: string | null;
}[] = [
  { id: "clean", label: { ar: "بسيط", en: "Clean" }, filter: "normal", frame: null },
  { id: "clinic", label: { ar: "عيادة", en: "Clinic Blue" }, filter: "cool", frame: "#0ea5e9" },
  { id: "care", label: { ar: "دافئ", en: "Warm Care" }, filter: "warm", frame: "#f59e0b" },
  { id: "minimal", label: { ar: "أبيض", en: "Minimal White" }, filter: "bright", frame: "#ffffff" },
  { id: "vintage", label: { ar: "كلاسيكي", en: "Vintage" }, filter: "vintage", frame: null },
];

const SIZE_PX: Record<TextOverlay["size"], number> = { sm: 22, md: 32, lg: 44 };

let uid = 0;
function nextId() {
  uid += 1;
  return `t${Date.now()}${uid}`;
}

type Tool = "crop" | "adjust" | "filters" | "tune" | "text" | "templates";

function composeFilterCss(base: string, brightness: number, contrast: number, saturation: number) {
  const parts: string[] = [];
  if (base && base !== "none") parts.push(base);
  if (brightness !== 100) parts.push(`brightness(${brightness / 100})`);
  if (contrast !== 100) parts.push(`contrast(${contrast / 100})`);
  if (saturation !== 100) parts.push(`saturate(${saturation / 100})`);
  return parts.length ? parts.join(" ") : "none";
}

export default function MediaEditor({
  file,
  locale,
  onCancel,
  onSkip,
  onApply,
}: {
  file: File;
  locale: string;
  onCancel: () => void;
  onSkip: (originalFile: File) => void;
  onApply: (editedFile: File) => void;
}) {
  const ar = locale === "ar";
  const [objectUrl, setObjectUrl] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<Tool>("filters");
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [aspect, setAspect] = useState<Aspect>("free");
  const [filterKey, setFilterKey] = useState<FilterKey>("normal");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [frameColor, setFrameColor] = useState<string | null>(null);
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [newTextInput, setNewTextInput] = useState("");
  const [exporting, setExporting] = useState(false);
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null);
  const dragState = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setNaturalRatio(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const swapped = rotation % 180 !== 0;
  const activeText = texts.find((t) => t.id === activeTextId) ?? null;

  // `ratioForAspect` stays null for "free" so the export step keeps cropping
  // to the image's own (post-rotation) dimensions, i.e. no crop at all.
  const ratioForAspect = ASPECTS.find((a) => a.id === aspect)?.ratio ?? null;
  // The preview, however, must always have a real height: since its only
  // children are absolutely positioned, a box with no aspect-ratio and no
  // explicit height collapses to zero and `overflow-hidden` clips
  // everything — hiding the image (and any edits) entirely. Fall back to
  // the image's own natural ratio so "free" mode still shows something.
  const previewRatio = ratioForAspect ?? naturalRatio ?? 1;
  const previewAspectStyle: React.CSSProperties = {
    aspectRatio: swapped ? 1 / previewRatio : previewRatio,
  };

  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    setFilterKey(t.filter);
    setFrameColor(t.frame);
  }

  function addText() {
    const text = newTextInput.trim();
    if (!text) return;
    const id = nextId();
    setTexts((prev) => [...prev, { id, text, xPct: 50, yPct: 50, color: "#ffffff", size: "md" }]);
    setActiveTextId(id);
    setNewTextInput("");
  }

  function updateActiveText(patch: Partial<TextOverlay>) {
    if (!activeTextId) return;
    setTexts((prev) => prev.map((t) => (t.id === activeTextId ? { ...t, ...patch } : t)));
  }

  function removeActiveText() {
    if (!activeTextId) return;
    setTexts((prev) => prev.filter((t) => t.id !== activeTextId));
    setActiveTextId(null);
  }

  function handlePointerDown(e: React.PointerEvent, t: TextOverlay) {
    e.stopPropagation();
    setActiveTextId(t.id);
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragState.current = {
      id: t.id,
      offsetX: e.clientX - (rect.left + (t.xPct / 100) * rect.width),
      offsetY: e.clientY - (rect.top + (t.yPct / 100) * rect.height),
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragState.current;
    const rect = previewRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const x = e.clientX - drag.offsetX - rect.left;
    const y = e.clientY - drag.offsetY - rect.top;
    const xPct = Math.min(96, Math.max(4, (x / rect.width) * 100));
    const yPct = Math.min(96, Math.max(4, (y / rect.height) * 100));
    setTexts((prev) => prev.map((t) => (t.id === drag.id ? { ...t, xPct, yPct } : t)));
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  async function handleApply() {
    const img = imgRef.current;
    if (!img) return;
    setExporting(true);
    try {
      const file2 = await buildEditedFile({
        img,
        rotation,
        flipH,
        aspect: ratioForAspect,
        filterCss: composeFilterCss(FILTERS[filterKey], brightness, contrast, saturation),
        frameColor,
        texts,
        originalName: file.name,
      });
      onApply(file2);
    } catch (err) {
      console.error("[MediaEditor] export failed", err);
      onSkip(file);
    } finally {
      setExporting(false);
    }
  }

  const tools: { id: Tool; icon: typeof Crop; label: { ar: string; en: string } }[] = [
    { id: "crop", icon: Crop, label: { ar: "قص", en: "Crop" } },
    { id: "adjust", icon: RotateCw, label: { ar: "تدوير", en: "Rotate" } },
    { id: "filters", icon: Wand2, label: { ar: "فلاتر", en: "Filters" } },
    { id: "tune", icon: SlidersHorizontal, label: { ar: "ضبط", en: "Tune" } },
    { id: "templates", icon: Palette, label: { ar: "قوالب", en: "Templates" } },
    { id: "text", icon: Type, label: { ar: "نص", en: "Text" } },
  ];

  return (
    <div className="theme-fixed-dark fixed inset-0 z-[10001] flex flex-col bg-[#05060a]" dir={ar ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <button type="button" onClick={onCancel} className="text-white/50 hover:text-white flex items-center gap-1.5 text-sm">
          <X size={16} />
          {ar ? "إلغاء" : "Cancel"}
        </button>
        <div className="flex flex-col items-center">
          <p className="text-sm font-bold text-white">{ar ? "تحرير الصورة" : "Edit photo"}</p>
          <button
            type="button"
            onClick={() => onSkip(file)}
            className="text-[10px] text-white/35 hover:text-white/60 underline"
          >
            {ar ? "استخدام الصورة الأصلية" : "Use original"}
          </button>
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={exporting}
          className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {ar ? "تم" : "Done"}
        </button>
      </div>

      {/* Preview */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-4 overflow-hidden">
        <div
          className="relative max-w-full max-h-full"
          style={{ padding: frameColor ? "3%" : 0, background: frameColor ?? "transparent", borderRadius: 12 }}
        >
          <div
            ref={previewRef}
            className="relative overflow-hidden bg-black rounded-lg touch-none"
            style={{
              ...previewAspectStyle,
              maxHeight: "60vh",
              maxWidth: "min(90vw, 480px)",
              width: ratioForAspect ? undefined : "min(90vw, 480px)",
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={() => setActiveTextId(null)}
          >
            {objectUrl ? (
              // Transform and filter are applied on separate nested elements (rather than
              // combined on one node) to avoid a GPU-compositing glitch on some Windows/Chromium
              // setups where an element with both `transform` and `filter` renders solid black
              // the moment the filter value changes.
              <div
                className="absolute inset-0"
                style={{ transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={objectUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
                  style={{ filter: composeFilterCss(FILTERS[filterKey], brightness, contrast, saturation) }}
                  draggable={false}
                  onLoad={(e) => {
                    const el = e.currentTarget;
                    if (el.naturalWidth && el.naturalHeight) {
                      setNaturalRatio(el.naturalWidth / el.naturalHeight);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={22} className="animate-spin text-white/40" />
              </div>
            )}
            {tool === "crop" && (
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/25" />
                ))}
              </div>
            )}
            {texts.map((t) => (
              <div
                key={t.id}
                onPointerDown={(e) => handlePointerDown(e, t)}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTextId(t.id);
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move select-none font-bold whitespace-nowrap px-1 ${
                  activeTextId === t.id ? "outline outline-2 outline-dashed outline-indigo-400/80" : ""
                }`}
                style={{
                  left: `${t.xPct}%`,
                  top: `${t.yPct}%`,
                  color: t.color,
                  fontSize: SIZE_PX[t.size] * 0.55,
                  textShadow: "0 1px 4px rgba(0,0,0,0.7)",
                }}
              >
                {t.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contextual controls */}
      <div className="shrink-0 border-t border-white/10 bg-[#0a0d16] px-4 py-3 space-y-3 max-h-[38vh] overflow-y-auto">
        {tool === "crop" && (
          <div className="flex gap-2 flex-wrap">
            {ASPECTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAspect(a.id)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold border transition ${
                  aspect === a.id ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" : "border-white/10 text-white/50"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}

        {tool === "adjust" && (
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/5"
            >
              <RotateCw size={14} />
              {ar ? "تدوير 90°" : "Rotate 90°"}
            </button>
            <button
              type="button"
              onClick={() => setFlipH((f) => !f)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                flipH ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" : "border-white/10 text-white/70"
              }`}
            >
              <FlipHorizontal size={14} />
              {ar ? "قلب أفقي" : "Flip"}
            </button>
          </div>
        )}

        {tool === "filters" && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(FILTERS) as FilterKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilterKey(k)}
                className="shrink-0 flex flex-col items-center gap-1.5"
              >
                <span
                  className={`h-14 w-14 rounded-xl overflow-hidden border-2 ${
                    filterKey === k ? "border-indigo-500" : "border-white/10"
                  }`}
                  style={{ backgroundImage: `url(${objectUrl})`, backgroundSize: "cover", backgroundPosition: "center", filter: FILTERS[k] }}
                />
                <span className={`text-[10px] ${filterKey === k ? "text-indigo-300" : "text-white/50"}`}>
                  {ar ? FILTER_LABELS[k].ar : FILTER_LABELS[k].en}
                </span>
              </button>
            ))}
          </div>
        )}

        {tool === "tune" && (
          <div className="space-y-4">
            {[
              { key: "brightness", label: { ar: "السطوع", en: "Brightness" }, value: brightness, setter: setBrightness },
              { key: "contrast", label: { ar: "التباين", en: "Contrast" }, value: contrast, setter: setContrast },
              { key: "saturation", label: { ar: "التشبع", en: "Saturation" }, value: saturation, setter: setSaturation },
            ].map((s) => (
              <div key={s.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-white/60">{ar ? s.label.ar : s.label.en}</span>
                  <span className="text-[10px] text-white/35">{s.value}%</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={160}
                  value={s.value}
                  onChange={(e) => s.setter(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setBrightness(100);
                setContrast(100);
                setSaturation(100);
              }}
              className="text-[11px] text-white/40 underline hover:text-white/60"
            >
              {ar ? "إعادة تعيين" : "Reset"}
            </button>
          </div>
        )}

        {tool === "templates" && (
          <div className="space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="shrink-0 flex flex-col items-center gap-1.5"
                >
                  <span
                    className="h-14 w-14 rounded-xl overflow-hidden border-2 border-white/10"
                    style={{
                      backgroundImage: `url(${objectUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: FILTERS[t.filter],
                      boxShadow: t.frame ? `inset 0 0 0 3px ${t.frame}` : undefined,
                    }}
                  />
                  <span className="text-[10px] text-white/50">{ar ? t.label.ar : t.label.en}</span>
                </button>
              ))}
            </div>
            <div>
              <p className="text-[11px] text-white/35 mb-1.5">{ar ? "لون الإطار" : "Frame color"}</p>
              <div className="flex gap-2">
                {FRAME_COLORS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFrameColor(f.color)}
                    className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${
                      frameColor === f.color ? "border-indigo-400" : "border-white/15"
                    }`}
                    style={{ background: f.color ?? "transparent" }}
                  >
                    {!f.color && <X size={12} className="text-white/40" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tool === "text" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={newTextInput}
                onChange={(e) => setNewTextInput(e.target.value)}
                placeholder={ar ? "اكتب نصاً..." : "Type text..."}
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-indigo-500/50"
              />
              <button
                type="button"
                onClick={addText}
                disabled={!newTextInput.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                {ar ? "إضافة" : "Add"}
              </button>
            </div>
            {activeText && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-white/40">{ar ? "تحرير النص المحدد" : "Edit selected text"}</p>
                  <button type="button" onClick={removeActiveText} className="text-rose-400 hover:text-rose-300">
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  value={activeText.text}
                  onChange={(e) => updateActiveText({ text: e.target.value })}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white outline-none"
                />
                <div className="flex items-center gap-2">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateActiveText({ color: c })}
                      className={`h-6 w-6 rounded-full border-2 ${activeText.color === c ? "border-indigo-400" : "border-white/20"}`}
                      style={{ background: c }}
                    />
                  ))}
                  <div className="flex gap-1 ms-2">
                    {(["sm", "md", "lg"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateActiveText({ size: s })}
                        className={`rounded-lg px-2 py-1 text-[10px] font-semibold border ${
                          activeText.size === s ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" : "border-white/10 text-white/50"
                        }`}
                      >
                        {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tool tabs */}
      <div className="shrink-0 flex items-center justify-around border-t border-white/10 bg-[#0c0f1a] px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tools.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTool(id)}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition ${
              tool === id ? "text-indigo-300 bg-indigo-500/10" : "text-white/40"
            }`}
          >
            <Icon size={18} />
            <span className="text-[10px] font-medium">{ar ? label.ar : label.en}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

async function buildEditedFile({
  img,
  rotation,
  flipH,
  aspect,
  filterCss,
  frameColor,
  texts,
  originalName,
}: {
  img: HTMLImageElement;
  rotation: number;
  flipH: boolean;
  aspect: number | null;
  filterCss: string;
  frameColor: string | null;
  texts: TextOverlay[];
  originalName: string;
}): Promise<File> {
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  const swapped = rotation % 180 !== 0;
  const baseW = swapped ? naturalH : naturalW;
  const baseH = swapped ? naturalW : naturalH;

  const base = document.createElement("canvas");
  base.width = baseW;
  base.height = baseH;
  const baseCtx = base.getContext("2d")!;
  baseCtx.translate(baseW / 2, baseH / 2);
  baseCtx.rotate((rotation * Math.PI) / 180);
  if (flipH) baseCtx.scale(-1, 1);
  baseCtx.drawImage(img, -naturalW / 2, -naturalH / 2, naturalW, naturalH);

  const targetRatio = aspect ?? baseW / baseH;
  let cropW = baseW;
  let cropH = baseH;
  if (baseW / baseH > targetRatio) {
    cropH = baseH;
    cropW = cropH * targetRatio;
  } else {
    cropW = baseW;
    cropH = cropW / targetRatio;
  }
  const cropX = (baseW - cropW) / 2;
  const cropY = (baseH - cropH) / 2;

  const MAX_DIM = 1440;
  const scale = Math.min(1, MAX_DIM / Math.max(cropW, cropH));
  const outW = Math.max(1, Math.round(cropW * scale));
  const outH = Math.max(1, Math.round(cropH * scale));
  const pad = frameColor ? Math.round(Math.min(outW, outH) * 0.035) : 0;

  const final = document.createElement("canvas");
  final.width = outW + pad * 2;
  final.height = outH + pad * 2;
  const ctx = final.getContext("2d")!;

  if (frameColor) {
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, final.width, final.height);
  }

  ctx.filter = filterCss;
  ctx.drawImage(base, cropX, cropY, cropW, cropH, pad, pad, outW, outH);
  ctx.filter = "none";

  for (const t of texts) {
    const fontSize = Math.max(14, (SIZE_PX[t.size] / 480) * outW);
    ctx.font = `700 ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const x = pad + (t.xPct / 100) * outW;
    const y = pad + (t.yPct / 100) * outH;
    ctx.lineWidth = Math.max(2, fontSize * 0.12);
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.strokeText(t.text, x, y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, x, y);
  }

  const blob: Blob = await new Promise((resolve, reject) => {
    final.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.92
    );
  });

  const baseName = originalName.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}-edited.jpg`, { type: "image/jpeg" });
}
