import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600; // ISR: regenerate every hour

const SITE_URL = "https://troiamedia.com";
const PODCAST_TITLE = "WorldScope Daily Briefing";
const PODCAST_DESC =
  "AI-generated daily intelligence briefing covering global events, conflicts, finance, cyber threats, and more. Powered by WorldScope.";
const PODCAST_AUTHOR = "WorldScope";
const PODCAST_LANG = "en";

/**
 * GET /podcast.xml
 *
 * Podcast RSS feed for Apple Podcasts / Spotify / any podcast player.
 * Lists the last 7 days of daily briefings.
 */
export async function GET() {
  const now = new Date();
  const episodes: string[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const pubDate = d.toUTCString();
    const title = `WorldScope Briefing - ${d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`;
    const audioUrl = `${SITE_URL}/api/podcast/generate?date=${dateStr}`;
    const guid = `worldscope-briefing-${dateStr}`;

    episodes.push(`
    <item>
      <title>${escapeXml(title)}</title>
      <description>${escapeXml(
        `Daily intelligence briefing for ${dateStr}. Top global events summarized by AI.`
      )}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${guid}</guid>
      <enclosure url="${escapeXml(audioUrl)}" type="audio/mpeg" length="0" />
      <itunes:duration>300</itunes:duration>
      <itunes:episode>${7 - i}</itunes:episode>
      <itunes:explicit>false</itunes:explicit>
    </item>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(PODCAST_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(PODCAST_DESC)}</description>
    <language>${PODCAST_LANG}</language>
    <copyright>Copyright ${now.getFullYear()} WorldScope</copyright>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/podcast.xml" rel="self" type="application/rss+xml" />
    <itunes:author>${escapeXml(PODCAST_AUTHOR)}</itunes:author>
    <itunes:summary>${escapeXml(PODCAST_DESC)}</itunes:summary>
    <itunes:category text="News">
      <itunes:category text="Daily News" />
    </itunes:category>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <itunes:image href="${SITE_URL}/icon-512.png" />
    ${episodes.join("\n")}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
