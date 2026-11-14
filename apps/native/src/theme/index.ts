import { Platform } from "react-native";

// ── Color palette — matches the web design system exactly ──────────────────
export const Colors = {
  // Backgrounds
  bgRoot:        "#060912",
  bgSurface:     "#0d1127",
  bgCard:        "#111827",
  bgCardRaised:  "#16213a",
  bgInput:       "rgba(99,102,241,0.08)",
  bgHover:       "rgba(255,255,255,0.05)",

  // Borders
  border:        "rgba(99,102,241,0.18)",
  borderHover:   "rgba(99,102,241,0.35)",

  // Text
  text1:         "#f0f4ff",
  text2:         "#a0abc8",
  text3:         "#5a6584",

  // Brand
  indigo:        "#6366f1",
  indigoLight:   "#818cf8",
  indigoDark:    "#4f46e5",
  violet:        "#8b5cf6",
  cyan:          "#06b6d4",
  teal:          "#14b8a6",
  emerald:       "#10b981",
  amber:         "#f59e0b",
  rose:          "#f43f5e",
  success:       "#22c55e",
  warning:       "#f59e0b",
  danger:        "#ef4444",

  // Gradients (as arrays for LinearGradient)
  gradientIndigo:  ["#6366f1", "#8b5cf6"] as const,
  gradientCyan:    ["#0891b2", "#6366f1"] as const,
  gradientEmerald: ["#10b981", "#059669"] as const,
  gradientAmber:   ["#f59e0b", "#d97706"] as const,

  // Transparent overlays
  overlay:       "rgba(6,9,18,0.9)",
  overlayLight:  "rgba(6,9,18,0.6)",

  // Map
  mapBg:         "#f2efe9",
} as const;

// ── Typography ──────────────────────────────────────────────────────────────
export const Typography = {
  fontFamily: Platform.select({
    ios:     "System",
    android: "Cairo",  // We'll load Cairo font
    default: "System",
  }),
  sizes: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   16,
    lg:   18,
    xl:   20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  weights: {
    normal:    "400" as const,
    medium:    "500" as const,
    semibold:  "600" as const,
    bold:      "700" as const,
    extrabold: "800" as const,
    black:     "900" as const,
  },
} as const;

// ── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  0:   0,
  1:   4,
  2:   8,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  10:  40,
  12:  48,
  16:  64,
  // Named aliases used throughout screens:
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
} as const;

// ── Radius ───────────────────────────────────────────────────────────────────
export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  "2xl": 24,
  full: 9999,
} as const;

// ── Shadows ──────────────────────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  indigo: {
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ── Layout constants ─────────────────────────────────────────────────────────
export const Layout = {
  bottomTabHeight:   64,
  headerHeight:      56,
  statusBarHeight:   44,
  inputHeight:       48,
  buttonHeight:      48,
  touchTarget:       44,
} as const;
