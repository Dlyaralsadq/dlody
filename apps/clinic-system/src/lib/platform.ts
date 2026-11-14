export type DevicePlatform = "windows" | "mac" | "linux" | "android" | "ios" | "unknown";

interface NavigatorUAData {
  platform?: string;
  mobile?: boolean;
}

/**
 * UA-string-only classification, safe to run on the server (e.g. from the
 * `user-agent` request header) as well as the client. Used as the base for
 * both `detectPlatform()` (client) and the SSR platform detection in the
 * root layout, so the very first HTML response already matches the device —
 * no client-side flash / no dependency on viewport width.
 */
export function detectPlatformFromUserAgent(ua: string | null | undefined): DevicePlatform {
  if (!ua) return "unknown";
  if (/windows/i.test(ua)) return "windows";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/macintosh|mac os x/i.test(ua)) return "mac";
  if (/linux/i.test(ua)) return "linux";
  return "unknown";
}

/**
 * Best-effort detection of the underlying OS/device so the UI (install prompts,
 * layout chrome, etc.) can adapt between a "desktop app" feel on Windows/Mac/Linux
 * and a "mobile app" feel on Android/iOS. Intentionally NOT based on viewport
 * width — a desktop browser window that happens to be narrow should still get
 * the desktop layout, and vice versa.
 */
export function detectPlatform(): DevicePlatform {
  if (typeof navigator === "undefined") return "unknown";

  const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData }).userAgentData;
  const uaPlatform = uaData?.platform?.toLowerCase() ?? "";

  if (uaPlatform.includes("windows")) return "windows";
  if (uaPlatform.includes("android")) return "android";
  if (uaPlatform.includes("mac")) return "mac";
  if (uaPlatform.includes("linux") && !uaPlatform.includes("android")) return "linux";

  const base = detectPlatformFromUserAgent(navigator.userAgent);
  // iPadOS 13+ masquerades as "Macintosh" but exposes multi-touch.
  if (base === "mac" && navigator.maxTouchPoints > 1) return "ios";
  return base;
}

export function isDesktopPlatform(platform: DevicePlatform): boolean {
  return platform === "windows" || platform === "mac" || platform === "linux";
}

export function isMobilePlatform(platform: DevicePlatform): boolean {
  return platform === "android" || platform === "ios";
}

/** True when the app is already running installed/standalone (no browser chrome). */
export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}
