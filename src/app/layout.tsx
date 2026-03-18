import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { WebVitals } from "@/components/shared/WebVitals";
import { ADSENSE_PUB_ID } from "@/config/ads";
import "./globals.css";

/** Self-hosted fonts via next/font — eliminates render-blocking external requests */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://worldscope.app";

export const metadata: Metadata = {
  title: {
    default: "WorldScope — Global Intelligence Dashboard",
    template: "%s | WorldScope",
  },
  description:
    "Real-time global intelligence, finance & technology monitoring platform. Track conflicts, cybersecurity, markets, and geopolitical events worldwide.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "WorldScope — Global Intelligence Dashboard",
    description: "Real-time global intelligence, finance & technology monitoring.",
    type: "website",
    siteName: "WorldScope",
  },
  twitter: {
    card: "summary_large_image",
    title: "WorldScope — Global Intelligence Dashboard",
    description: "Real-time global intelligence monitoring platform.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WorldScope",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

/** WebSite JSON-LD for Google rich results */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "WorldScope",
  url: siteUrl,
  description:
    "Real-time global intelligence dashboard monitoring conflicts, cybersecurity, finance, and geopolitics.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/country/{search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`dark ${jetbrainsMono.variable} ${inter.variable}`}>
      <head>
        {/* PWA & Mobile meta */}
        <meta name="theme-color" content="#050a12" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        {/* Performance: DNS prefetch + preconnect for external APIs */}
        <link rel="dns-prefetch" href="https://api.mapbox.com" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
        <link rel="dns-prefetch" href="https://opensky-network.org" />
        <link rel="preconnect" href="https://api.mapbox.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://img.youtube.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {ADSENSE_PUB_ID && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`}
            strategy="lazyOnload"
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="min-h-screen bg-hud-base text-hud-text overflow-hidden">
        {/* Skip to content — accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:bg-hud-accent focus:text-hud-base focus:px-4 focus:py-2 focus:rounded focus:font-mono focus:text-xs"
        >
          Skip to content
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <WebVitals />
            <main id="main-content">
              {children}
            </main>
            <div className="scanlines" aria-hidden="true" />
          </ThemeProvider>
        </NextIntlClientProvider>
        {/* Service Worker registration */}
        <Script id="sw-register" strategy="lazyOnload">
          {`if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}`}
        </Script>
      </body>
    </html>
  );
}
