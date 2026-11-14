import "./globals.css";
import { headers, cookies } from "next/headers";
import { detectPlatformFromUserAgent, isDesktopPlatform } from "@/lib/platform";
import { THEME_COOKIE, isValidTheme } from "@/lib/theme";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [headerList, cookieStore] = await Promise.all([headers(), cookies()]);
  const platform = detectPlatformFromUserAgent(headerList.get("user-agent"));
  // Determined once, server-side, from the request's User-Agent — so the very
  // first HTML sent to the browser already matches the device (desktop app
  // shell vs. mobile app shell), with no client-side flash and no dependency
  // on the current browser window width.
  const deviceMode = isDesktopPlatform(platform) ? "desktop" : "mobile";
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const theme = isValidTheme(themeCookie) ? themeCookie : "dark";

  return (
    <html suppressHydrationWarning className="h-full" data-platform={deviceMode} data-theme={theme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
