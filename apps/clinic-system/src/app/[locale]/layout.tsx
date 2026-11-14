import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import LocaleHtmlAttributes from "@/components/LocaleHtmlAttributes";
import PWAInstaller from "./patient/PWAInstaller";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ar = locale === "ar";
  return {
    title: ar ? "طبيبي" : "Tabibee",
    description: ar ? "منصة إدارة العيادات الطبية في العراق — tabibee.com" : "Medical clinic platform for Iraq — tabibee.com",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: ar ? "طبيبي" : "Tabibee",
    },
    applicationName: ar ? "طبيبي" : "Tabibee",
    icons: {
      icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/icons/icon.svg" }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "ar" | "en")) notFound();

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <LocaleHtmlAttributes locale={locale} />
      {children}
      <PWAInstaller locale={locale} />
    </NextIntlClientProvider>
  );
}