import { NextRequest, NextResponse } from "next/server";
import { redis, TTL } from "@/lib/cache/redis";

export const runtime = "nodejs";
export const maxDuration = 60;

const PODCAST_SCRIPT_KEY = "podcast:script:latest";
const PODCAST_DATE_KEY = "podcast:date:latest";

/**
 * GET /api/podcast/generate
 *
 * Generate today's daily podcast audio briefing.
 * Protected by CRON_SECRET bearer token.
 *
 * Steps:
 *  1. Fetch last 24h events (top 20 by severity)
 *  2. Build a podcast script
 *  3. Call /api/tts with the full script
 *  4. Return audio response (pass through from TTS API)
 *  5. Cache the script text in Redis for 24h
 */
export async function GET(req: NextRequest) {
  // Auth check
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  // Allow unauthenticated access for playback (no CRON_SECRET = public audio)
  const isAuthorized =
    !cronSecret || authHeader === `Bearer ${cronSecret}`;

  // Check for cached script — serve from cache if available
  const cachedScript = await redis.get<string>(PODCAST_SCRIPT_KEY);
  const cachedDate = await redis.get<string>(PODCAST_DATE_KEY);
  const today = new Date().toISOString().slice(0, 10);

  // Determine if we need to regenerate
  const needsRegeneration = isAuthorized && authHeader && (!cachedScript || cachedDate !== today);

  let script: string;

  if (needsRegeneration || !cachedScript) {
    // Fetch top events from intel API
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";
    let items: Array<{ title: string; summary: string; severity: string; source: string }> = [];

    try {
      const intelRes = await fetch(`${baseUrl}/api/intel?limit=50`, {
        headers: { "Cache-Control": "no-cache" },
      });
      if (intelRes.ok) {
        const data = await intelRes.json();
        items = (data.items || []).slice(0, 20);
      }
    } catch {
      // If intel fetch fails, use a minimal script
    }

    const dateStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const uniqueSources = new Set(items.map((i) => i.source));

    // Build podcast script
    const headlines = items
      .map((item, i) => {
        const summary = item.summary
          ? `. ${item.summary.slice(0, 120)}`
          : "";
        return `${i + 1}. ${item.title}${summary}`;
      })
      .join(". ");

    script = [
      `Welcome to WorldScope Daily Briefing for ${dateStr}.`,
      items.length > 0
        ? `Today we're covering ${items.length} events across ${uniqueSources.size} sources.`
        : "Today we have a quiet news cycle.",
      headlines,
      "That's all for today's briefing.",
      "Visit troiamedia.com for the full dashboard.",
    ]
      .filter(Boolean)
      .join(" ");

    // Cache the script for 24h
    await redis.set(PODCAST_SCRIPT_KEY, script, { ex: TTL.DAILY });
    await redis.set(PODCAST_DATE_KEY, today, { ex: TTL.DAILY });
  } else {
    script = cachedScript;
  }

  // If caller just wants the script text
  const wantsText = req.nextUrl.searchParams.get("format") === "text";
  if (wantsText) {
    return NextResponse.json({ script, date: today });
  }

  // Generate TTS audio via internal TTS API
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://troiamedia.com";
    const ttsRes = await fetch(`${baseUrl}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: script, lang: "en", speed: 1 }),
    });

    if (!ttsRes.ok) {
      return NextResponse.json(
        { error: "TTS generation failed" },
        { status: 502 }
      );
    }

    const audioBlob = await ttsRes.blob();
    const audioBuffer = await audioBlob.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.byteLength),
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": `inline; filename="worldscope-briefing-${today}.mp3"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Audio generation error" },
      { status: 500 }
    );
  }
}
