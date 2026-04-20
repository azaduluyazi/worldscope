import { createServerClient } from "@/lib/db/supabase";

// Skip build prerender — Supabase query has exceeded 60s build worker limit.
export const dynamic = "force-dynamic";
export const revalidate = 600;

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";

  let items = "";

  try {
    const db = createServerClient();
    const { data } = await db
      .from("blog_posts")
      .select("slug, title, excerpt, category, published_at")
      .eq("published", true)
      .eq("lang", "en")
      .order("published_at", { ascending: false })
      .limit(30);

    if (data) {
      items = data
        .map(
          (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || post.title}]]></description>
      <category>${post.category}</category>
      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
    </item>`
        )
        .join("");
    }
  } catch {
    // Supabase may not be available — return empty feed
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>WorldScope Intelligence Blog</title>
    <link>${siteUrl}/blog</link>
    <description>AI-powered intelligence analysis, threat reports, and geopolitical insights.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/blog/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml.trim(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
    },
  });
}
