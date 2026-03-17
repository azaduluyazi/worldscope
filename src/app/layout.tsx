import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { WebVitals } from "@/components/shared/WebVitals";
import { ADSENSE_PUB_ID } from "@/config/ads";
import "./globals.css";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
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
        <ThemeProvider>
          <WebVitals />
          <main id="main-content">
            {children}
          </main>
          <div className="scanlines" aria-hidden="true" />
        </ThemeProvider>
      </body>
    </html>
  );
}
