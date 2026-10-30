"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstaller({ locale = "ar" }: { locale?: string }) {
  const ar = locale === "ar";
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    const dismissedBefore = localStorage.getItem("pwa-install-dismissed");
    if (dismissedBefore) setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
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

  if (installed || dismissed || !deferred) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-[2000] mx-auto max-w-md animate-slide-up">
      <div className="flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-[#0c1121]/95 backdrop-blur-md p-4 shadow-2xl">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xl">
          🏥
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{ar ? "ثبّت ClinicPro" : "Install ClinicPro"}</p>
          <p className="text-[11px] text-white/40 truncate">
            {ar ? "Android · iPhone · Windows · Mac" : "Android · iPhone · Windows · Mac"}
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shrink-0"
        >
          <Download size={14} />
          {ar ? "تثبيت" : "Install"}
        </button>
        <button onClick={handleDismiss} className="text-white/30 hover:text-white/60 shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
