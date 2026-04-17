import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";
// Force request-time generation: avoids Next.js build-time static generation
// hitting Supabase under IO pressure (build would fail with 60s timeout).
// ISR via `revalidate` still caches the result for 5 minutes after first hit.
export const dynamic = "force-dynamic";
export const revalidate = 300;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";
const PUBLICATION_NAME = "TroiaMedia";
const PUBLICATION_LANG = "en";

/**
 * Google News Sitemap — follows https://www.google.com/schemas/sitemap-news/0.9
 *
 * Requirements:
 * - Only articles published in the last 48 hours
 * - Maximum 1,000 URLs
 * - <news:publication>, <news:publication_date>, <news:title>
 */
export async function GET() {
  const urls: string[] = [];
  const now = new Date();
  const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  try {
    const db = createServerClient();

    const { data: reports } = await db
      .from("reports")
      .select("type, date, content, generated_at")
      .eq("lang", "en")
      .gte("generated_at", cutoff.toISOString())
      .order("generated_at", { ascending: false })
      .limit(400);

    if (reports) {
      for (const r of reports) {
        const title = escapeXml(
          `${r.type === "weekly" ? "Weekly" : "Daily"} Intelligence Briefing — ${r.date}`,
        );
        urls.push(
          `  <url>
    <loc>${BASE_URL}/reports/${r.type}/${r.date}</loc>
    <news:news>
      <news:publication>
        <news:name>${PUBLICATION_NAME}</news:name>
        <news:language>${PUBLICATION_LANG}</news:language>
      </news:publication>
      <news:publication_date>${new Date(r.generated_at).toISOString()}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`,
        );
      }
    }

    const { data: posts } = await db
      .from("blog_posts")
      .select("slug, title, published_at")
      .eq("published", true)
      .gte("published_at", cutoff.toISOString())
      .order("published_at", { ascending: false })
      .limit(400);

    if (posts) {
      for (const p of posts) {
        urls.push(
          `  <url>
    <loc>${BASE_URL}/blog/${p.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>${PUBLICATION_NAME}</news:name>
        <news:language>${PUBLICATION_LANG}</news:language>
      </news:publication>
      <news:publication_date>${new Date(p.published_at).toISOString()}</news:publication_date>
      <news:title>${escapeXml(p.title)}</news:title>
    </news:news>
  </url>`,
        );
      }
    }

    // Use published_at (matches events table schema — there is no created_at column)
    const { data: events } = await db
      .from("events")
      .select("id, title, published_at")
      .gte("published_at", cutoff.toISOString())
      .order("published_at", { ascending: false })
      .limit(200);

    if (events) {
      for (const e of events) {
        urls.push(
          `  <url>
    <loc>${BASE_URL}/events/${e.id}</loc>
    <news:news>
      <news:publication>
        <news:name>${PUBLICATION_NAME}</news:name>
        <news:language>${PUBLICATION_LANG}</news:language>
      </news:publication>
      <news:publication_date>${new Date(e.published_at).toISOString()}</news:publication_date>
      <news:title>${escapeXml(e.title || "Live Intelligence Event")}</news:title>
    </news:news>
  </url>`,
        );
      }
    }
  } catch {
    // Database unavailable at build time — return empty valid sitemap
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.slice(0, 1000).join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
