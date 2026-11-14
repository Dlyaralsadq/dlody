"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_COOKIE, type ThemeMode } from "@/lib/theme";

/** Self-contained: styled entirely off CSS variables so it stays legible
 * regardless of which theme is currently active or what card it sits on. */
export default function ThemeToggle({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as ThemeMode) || "dark";
    setTheme(current);
  }, []);

  function apply(next: ThemeMode) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    try {
      localStorage.setItem(THEME_COOKIE, next);
    } catch {
      // ignore (private browsing, etc.)
    }
  }

  const options: { value: ThemeMode; icon: typeof Moon; label: string }[] = [
    { value: "dark", icon: Moon, label: ar ? "داكن" : "Dark" },
    { value: "light", icon: Sun, label: ar ? "فاتح" : "Light" },
  ];

  return (
    <div
      className="inline-flex items-center gap-1 rounded-2xl p-1"
      style={{ border: "1px solid var(--border)", background: "var(--bg-hover)" }}
    >
      {options.map(({ value, icon: Icon, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => apply(value)}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all"
            style={
              active
                ? { background: "var(--indigo)", color: "#fff" }
                : { color: "var(--text-2)" }
            }
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
