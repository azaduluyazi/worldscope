import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.newsapi.org" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: [
      "mapbox-gl",
      "react-map-gl",
      "three",
      "react-globe.gl",
      "three-globe",
      "lucide-react",
      "swr",
      "@supabase/supabase-js",
      "@ai-sdk/groq",
      "@upstash/ratelimit",
      "next-intl",
      "recharts",
      "@tremor/react",
      "jspdf",
      "resend",
      "framer-motion",
      "cmdk",
    ],
  },
  redirects: async () => [
    // Canonical RSS feed is /feed.xml. Legacy aliases (old feed readers,
    // external links, sitemap scrapers) 301 to the canonical path so we
    // don't leak crawl budget to 404s.
    { source: "/rss", destination: "/feed.xml", permanent: true },
    { source: "/rss.xml", destination: "/feed.xml", permanent: true },
    { source: "/feed", destination: "/feed.xml", permanent: true },
    { source: "/atom.xml", destination: "/feed.xml", permanent: true },
    // Some tooling expects the W3C .webmanifest extension; canonical is /manifest.json.
    { source: "/manifest.webmanifest", destination: "/manifest.json", permanent: true },
  ],
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-DNS-Prefetch-Control", value: "on" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // Clerk serves its JS bundle from our own satellite subdomain
            // (clerk.troiamedia.com) and its API from the same. It also
            // fetches avatars and session tokens from *.clerk.accounts.dev
            // (legacy/dev) and *.clerk.com (managed assets). Added 2026-04-21
            // after the prod-instance switch left CSP stuck on the old
            // allowlist, silently blocking clerk-js load on /sign-up.
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.troiamedia.com https://*.clerk.com https://*.clerk.accounts.dev https://pagead2.googlesyndication.com https://plausible.io https://*.plausible.io",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: blob: https: http:",
            "connect-src 'self' https://clerk.troiamedia.com https://*.clerk.com https://*.clerk.accounts.dev https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://*.mapbox.com https://api.groq.com https://api.openai.com https://api.anthropic.com https://opensky-network.org https://*.aisstream.io https://pagead2.googlesyndication.com https://plausible.io https://*.plausible.io https://firms.modaps.eosdis.nasa.gov https://earthquake.usgs.gov https://celestrak.org https://api.stlouisfed.org https://finnhub.io",
            "frame-src 'self' https://clerk.troiamedia.com https://*.clerk.com https://pagead2.googlesyndication.com https://*.youtube.com",
            "worker-src 'self' blob: https://clerk.troiamedia.com",
            "media-src 'self' blob: https:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        },
      ],
    },
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
    {
      // Long cache for static assets
      source: "/_next/static/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      // Cache GeoJSON files — rarely change
      source: "/geo/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
      ],
    },
  ],
};

export default withSentryConfig(withBundleAnalyzer(withNextIntl(nextConfig)), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
});
