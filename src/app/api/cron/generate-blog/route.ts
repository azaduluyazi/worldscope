import { NextResponse } from "next/server";
import { generateText } from "ai";
import { briefModel } from "@/lib/ai/providers";
import { fetchPersistedEvents } from "@/lib/db/events";
import { createServerClient } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * GET /api/cron/generate-blog
 * Generates weekly blog posts from intelligence data.
 * Runs every Monday at 07:00 UTC via Vercel Cron.
 *
 * Rotates between 3 content series:
 * - Week 1: "Weekly Intelligence Digest" (global overview)
 * - Week 2: "Country Spotlight" (deep dive on trending country)
 * - Week 3: "Threat Landscape" (cyber + conflict focused)
 * - Week 4: "Market & Geopolitics" (finance + diplomacy)
 *
 * Schedule: "0 7 * * 1" (Mondays at 07:00 UTC)
 */

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/** Get ISO week number */
function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}

/** Determine which content series to run this week */
function getSeriesForWeek(week: number): {
  series: string;
  slug_prefix: string;
  category: string;
  systemPrompt: string;
} {
  const cycle = week % 4;

  switch (cycle) {
    case 0:
      return {
        series: "Weekly Intelligence Digest",
        slug_prefix: "weekly-intelligence-digest",
        category: "intelligence",
        systemPrompt: `You are WorldScope's senior intelligence analyst. Write a comprehensive weekly intelligence digest blog post. Cover:
- Executive summary of the week's major events
- Regional hotspots and emerging threats
- Key conflict zone updates
- Notable cyber incidents
- Market-moving geopolitical events
- Outlook for the coming week
Write 800-1200 words in professional analytical tone. Use HTML formatting (<h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>). Do not include <h1>. Start with the executive summary directly.`,
      };
    case 1:
      return {
        series: "Country Spotlight",
        slug_prefix: "country-spotlight",
        category: "country",
        systemPrompt: `You are WorldScope's regional intelligence analyst. Write a deep-dive "Country Spotlight" blog post focusing on the country with the most events this week. Cover:
- Current political and security situation
- Recent escalation or de-escalation patterns
- Economic indicators and market impact
- Regional influence and alliances
- Risk outlook and scenarios
Write 800-1000 words in analytical tone. Use HTML formatting (<h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>). Do not include <h1>.`,
      };
    case 2:
      return {
        series: "Threat Landscape",
        slug_prefix: "threat-landscape",
        category: "cyber",
        systemPrompt: `You are WorldScope's cybersecurity and conflict analyst. Write a "Threat Landscape" blog post covering:
- Top cyber threats, CVEs, and ransomware incidents
- Active conflict zones and military movements
- Terrorism and insurgency updates
- GPS jamming and electronic warfare incidents
- Threat forecast for the coming weeks
Write 800-1000 words in professional security briefing tone. Use HTML formatting (<h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>). Do not include <h1>.`,
      };
    default:
      return {
        series: "Market & Geopolitics",
        slug_prefix: "market-geopolitics",
        category: "finance",
        systemPrompt: `You are WorldScope's geopolitical risk and market analyst. Write a "Market & Geopolitics" blog post covering:
- How geopolitical events are impacting global markets
- Commodity price movements tied to conflict/energy events
- Central bank and fiscal policy developments
- Sanctions and trade policy changes
- Investment risk outlook
Write 800-1000 words in professional analytical tone. Use HTML formatting (<h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>). Do not include <h1>.`,
      };
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Fetch events from the past 7 days
    const events = await fetchPersistedEvents({ limit: 200, hoursBack: 168 });

    if (events.length < 10) {
      return NextResponse.json({
        success: false,
        error: `Insufficient data: only ${events.length} events in the past 7 days`,
      });
    }

    // Determine content series
    const week = getWeekNumber();
    const year = new Date().getFullYear();
    const { series, slug_prefix, category, systemPrompt } = getSeriesForWeek(week);

    // Build event context
    const catCount: Record<string, number> = {};
    const countryCount: Record<string, number> = {};
    const sevCount: Record<string, number> = {};

    events.forEach((e) => {
      catCount[e.category] = (catCount[e.category] || 0) + 1;
      sevCount[e.severity] = (sevCount[e.severity] || 0) + 1;
      if (e.countryCode) {
        countryCount[e.countryCode] = (countryCount[e.countryCode] || 0) + 1;
      }
    });

    const topCountries = Object.entries(countryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([code, count]) => `${code}: ${count} events`)
      .join(", ");

    const topHeadlines = events
      .slice(0, 40)
      .map(
        (e, i) =>
          `${i + 1}. [${e.severity.toUpperCase()}/${e.category}] ${e.title} (${e.source})`
      )
      .join("\n");

    const statsBlock = `Week ${week} of ${year}
Total events (7 days): ${events.length}
Severity: ${Object.entries(sevCount).map(([k, v]) => `${k}=${v}`).join(", ")}
Categories: ${Object.entries(catCount).sort(([, a], [, b]) => b - a).map(([k, v]) => `${k}=${v}`).join(", ")}
Top countries: ${topCountries}`;

    // Generate blog content via AI
    const { text: content } = await generateText({
      model: briefModel,
      system: systemPrompt,
      prompt: `Write a "${series}" blog post based on this week's intelligence data:\n\n${statsBlock}\n\nTop headlines:\n${topHeadlines}`,
    });

    // Generate title and excerpt
    const { text: metaRaw } = await generateText({
      model: briefModel,
      system:
        "Generate a blog post title (max 80 chars) and excerpt (max 200 chars) for the given content. Return as JSON: {\"title\": \"...\", \"excerpt\": \"...\"}. No markdown, just pure JSON.",
      prompt: `Series: ${series}\nWeek: W${week} ${year}\n\nContent preview:\n${content.slice(0, 500)}`,
    });

    let title = `${series} — W${week} ${year}`;
    let excerpt = `WorldScope AI analysis of global intelligence events for week ${week} of ${year}.`;

    try {
      const meta = JSON.parse(metaRaw);
      if (meta.title) title = meta.title;
      if (meta.excerpt) excerpt = meta.excerpt;
    } catch {
      // Use defaults if JSON parsing fails
    }

    // Build slug
    const slug = `${slug_prefix}-${year}-w${week}`;

    // Generate tags from top categories
    const tags = [
      "weekly-digest",
      ...Object.keys(catCount).slice(0, 5),
      `w${week}-${year}`,
    ];

    // Save to Supabase
    const db = createServerClient();
    const { error: dbError } = await db.from("blog_posts").upsert(
      {
        slug,
        title,
        excerpt,
        content,
        category,
        tags,
        lang: "en",
        author: "WorldScope AI",
        published: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );

    if (dbError) {
      return NextResponse.json(
        { success: false, error: `DB error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slug,
      title,
      series,
      category,
      wordCount: content.split(/\s+/).length,
      eventCount: events.length,
      durationMs: Date.now() - startTime,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
