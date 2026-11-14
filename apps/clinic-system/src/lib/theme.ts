export const THEME_COOKIE = "clinic_theme";
export type ThemeMode = "dark" | "light";

export function isValidTheme(v: string | undefined | null): v is ThemeMode {
  return v === "dark" || v === "light";
}
