"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, Monitor, Smartphone } from "lucide-react";
import { detectPlatform, isStandalonePwa, type DevicePlatform } from "@/lib/platform";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstaller({ locale = "ar" }: { locale?: string }) {
  const ar = locale === "ar";
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<DevicePlatform>("unknown");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    setPlatform(detectPlatform());
    if (isStandalonePwa()) setInstalled(true);

    const dismissedBefore = localStorage.getItem("pwa-install-dismissed");
    if (dismissedBefore) setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "1");
  }

  const isIOS = platform === "ios";
  const isDesktop = platform === "windows" || platform === "mac" || platform === "linux";

  // Chromium (Windows/Mac/Linux/Android) fires beforeinstallprompt — we can trigger natively.
  // iOS Safari never fires it, so we show manual "Share → Add to Home Screen" instructions instead.
  if (installed || dismissed || (!deferred && !isIOS)) return null;

  const title = isDesktop
    ? ar
      ? "ثبّت طبيبي كتطبيق ويندوز"
      : "Install Tabibee as a Windows app"
    : ar
      ? "ثبّت طبيبي على هاتفك"
      : "Install Tabibee on your phone";

  const Icon = isDesktop ? Monitor : Smartphone;

  return (
    <div className="fixed bottom-4 inset-x-4 z-[2000] mx-auto max-w-md animate-slide-up">
      <div className="flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-[#0c1121]/95 backdrop-blur-md p-4 shadow-2xl">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{title}</p>
          {isIOS && !deferred ? (
            <p className="text-[11px] text-white/40 flex items-center gap-1 truncate">
              <Share size={11} className="shrink-0" />
              {ar ? "اضغط مشاركة ثم \"إضافة إلى الشاشة الرئيسية\"" : 'Tap Share, then "Add to Home Screen"'}
            </p>
          ) : (
            <p className="text-[11px] text-white/40 truncate">
              {isDesktop
                ? ar
                  ? "يفتح بنافذته الخاصة كأي برنامج على جهازك"
                  : "Opens in its own window, like a native app"
                : ar
                  ? "وصول سريع من شاشتك الرئيسية"
                  : "Quick access from your home screen"}
            </p>
          )}
        </div>
        {!(isIOS && !deferred) && (
          <button
            onClick={handleInstall}
            className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shrink-0"
          >
            <Download size={14} />
            {ar ? "تثبيت" : "Install"}
          </button>
        )}
        <button onClick={handleDismiss} className="text-white/30 hover:text-white/60 shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
