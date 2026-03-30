import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 600; // 10 min

export async function GET() {
  const db = createServerClient();

  const { data: events } = await db
    .from("events")
    .select("title, summary, url, published_at, category, severity")
    .order("published_at", { ascending: false })
    .limit(50);

  const items = (events || []).map((e) => `
    <item>
      <title><![CDATA[${e.title}]]></title>
      <description><![CDATA[${e.summary || ""}]]></description>
      <link>${e.url || "https://troiamedia.com"}</link>
      <pubDate>${new Date(e.published_at).toUTCString()}</pubDate>
      <category>${e.category}</category>
    </item>`).join("");

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
