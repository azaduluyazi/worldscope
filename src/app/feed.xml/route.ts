import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 600; // 10 min

// Minimal XML entity escaper for attribute/text nodes.
// CDATA sections handle title/description; this covers <link>, <guid>, <category>.
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const db = createServerClient();

  const { data: events } = await db
    .from("events")
    .select("id, title, summary, url, published_at, category, severity, source")
    .order("published_at", { ascending: false })
    .limit(50);

  const items = (events || [])
    .map((e) => {
      // Stable GUID: canonical article URL when available (permalink),
      // else a synthetic troiamedia.com URL built from the DB row id
      // so feed readers stop treating the same item as new on every poll.
      const hasPermaLink = Boolean(e.url);
      const guidValue = hasPermaLink
        ? e.url
        : `https://troiamedia.com/e/${e.id}`;
      const linkValue = e.url || `https://troiamedia.com/e/${e.id}`;

      return `
    <item>
      <title><![CDATA[${e.title}]]></title>
      <description><![CDATA[${e.summary || ""}]]></description>
      <link>${xmlEscape(linkValue)}</link>
      <guid isPermaLink="${hasPermaLink ? "true" : "false"}">${xmlEscape(guidValue)}</guid>
      <pubDate>${new Date(e.published_at).toUTCString()}</pubDate>
      <category>${xmlEscape(e.category)}</category>
      <source url="https://troiamedia.com">${xmlEscape(e.source || "WorldScope")}</source>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>WorldScope — Global Intelligence Feed</title>
    <link>https://troiamedia.com</link>
    <description>Real-time global intelligence, finance and technology monitoring</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://troiamedia.com/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
