import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/admin/", "/webhook/", "/cron/"],
      },
      {
        userAgent: "GPTBot",
        disallow: ["/"],
      },
      {
        userAgent: "CCBot",
        disallow: ["/"],
      },
      {
        userAgent: "anthropic-ai",
        disallow: ["/"],
      },
      {
        userAgent: "Google-Extended",
        disallow: ["/"],
      },
      // Explicit allow for AdSense crawler — prevents any future rule from
      // accidentally blocking ad serving. Mediapartners-Google is the AdSense
      // crawler and is distinct from Googlebot and Google-Extended.
      {
        userAgent: "Mediapartners-Google",
        allow: ["/"],
      },
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/sitemap-news.xml`,
    ],
    host: BASE_URL,
  };
}
