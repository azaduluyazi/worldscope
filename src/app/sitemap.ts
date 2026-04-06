import type { MetadataRoute } from "next";
import { COUNTRIES } from "@/config/countries";
import { createServerClient } from "@/lib/db/supabase";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ── Static pages ──
  entries.push(
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "always", priority: 1.0 },
    { url: `${BASE_URL}/tech`, lastModified: new Date(), changeFrequency: "always", priority: 0.9 },
    { url: `${BASE_URL}/finance`, lastModified: new Date(), changeFrequency: "always", priority: 0.9 },
    { url: `${BASE_URL}/reports`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/commodity`, lastModified: new Date(), changeFrequency: "always", priority: 0.9 },
    { url: `${BASE_URL}/happy`, lastModified: new Date(), changeFrequency: "always", priority: 0.9 },
    { url: `${BASE_URL}/analytics`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE_URL}/feeds`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE_URL}/api-docs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/developers`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    // /search is noindex (dynamic client-side page, no static content for crawlers)
    { url: `${BASE_URL}/showcase`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/newsletter/sample`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE_URL}/embed`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/podcast`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE_URL}/conflict`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/cyber`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/energy`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/health`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/sports`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/weather`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  );

  // ── Country pages ──
  for (const country of COUNTRIES) {
    entries.push({
      url: `${BASE_URL}/country/${country.code.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  // ── Report pages from Supabase ──
  try {
    const db = createServerClient();
    const { data } = await db
      .from("reports")
      .select("type, date, generated_at")
      .eq("lang", "en")
      .order("date", { ascending: false })
      .limit(120);

    if (data) {
      for (const report of data) {
        entries.push({
          url: `${BASE_URL}/reports/${report.type}/${report.date}`,
          lastModified: new Date(report.generated_at),
          changeFrequency: report.type === "weekly" ? "weekly" : "daily",
          priority: 0.6,
        });
      }
    }
  } catch {
    // Supabase may not be available at build time — skip reports
  }

  // ── Blog posts from Supabase ──
  try {
    const db = createServerClient();
    const { data } = await db
      .from("blog_posts")
      .select("slug, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(200);

    if (data) {
      for (const post of data) {
        entries.push({
          url: `${BASE_URL}/blog/${post.slug}`,
          lastModified: new Date(post.published_at),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  } catch {
    // Supabase may not be available at build time — skip blog posts
  }

  return entries;
}
