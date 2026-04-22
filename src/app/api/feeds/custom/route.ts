import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";

const VALID_CATEGORIES = new Set([
  "conflict", "finance", "cyber", "tech", "natural",
  "aviation", "energy", "diplomacy", "protest", "health", "sports",
]);

const VALID_SEVERITIES = new Set([
  "critical", "high", "medium", "low", "info",
]);

/**
 * GET /api/feeds/custom
 *
 * Build a custom RSS feed with filters:
 *   ?categories=conflict,finance
 *   &severity=high,critical
 *   &country=US
 *   &limit=50
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filters
    const categoriesParam = searchParams.get("categories");
    const severityParam = searchParams.get("severity");
    const countryParam = searchParams.get("country");
    const limitParam = searchParams.get("limit");

    const categories = categoriesParam
      ? categoriesParam.split(",").filter((c) => VALID_CATEGORIES.has(c.trim()))
      : [];

    const severities = severityParam
      ? severityParam.split(",").filter((s) => VALID_SEVERITIES.has(s.trim()))
      : [];

    const country = countryParam?.trim().toUpperCase() || null;

    const limit = Math.min(Math.max(parseInt(limitParam || "50", 10) || 50, 1), 100);

    // Query Supabase
    const db = createServerClient();
    let query = db
      .from("events")
      .select("title, summary, url, published_at, category, severity, country_code")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (categories.length > 0) {
      query = query.in("category", categories);
    }

    if (severities.length > 0) {
      query = query.in("severity", severities);
    }

    if (country) {
      query = query.eq("country_code", country);
    }

    const { data: events, error } = await query;

    if (error) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>${error.message}</description></channel></rss>`,
        {
          status: 500,
          headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
        }
      );
    }

    // Build filter description for feed title
    const filterParts: string[] = [];
    if (categories.length > 0) filterParts.push(`categories: ${categories.join(", ")}`);
    if (severities.length > 0) filterParts.push(`severity: ${severities.join(", ")}`);
    if (country) filterParts.push(`country: ${country}`);
    const filterDesc = filterParts.length > 0 ? ` (${filterParts.join("; ")})` : "";

    // Build RSS items
    const items = (events || [])
      .map(
        (e) => `
    <item>
      <title><![CDATA[${e.title}]]></title>
      <description><![CDATA[${e.summary || ""}]]></description>
      <link>${e.url || "https://troiamedia.com"}</link>
      <pubDate>${new Date(e.published_at).toUTCString()}</pubDate>
      <category>${e.category}</category>
    </item>`
      )
      .join("");

    const selfUrl = `https://troiamedia.com/api/feeds/custom?${searchParams.toString()}`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>WorldScope Custom Feed${filterDesc}</title>
    <link>https://troiamedia.com</link>
    <description>Custom filtered intelligence feed from WorldScope${filterDesc}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${selfUrl}" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch (err) {
    console.error("[feeds/custom]", err);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>Failed to generate feed</description></channel></rss>`,
      {
        status: 500,
        headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
      }
    );
  }
}
