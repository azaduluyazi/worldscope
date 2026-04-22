import { NextResponse } from "next/server";
import { generateText } from "ai";
import { briefModel } from "@/lib/ai/providers";
import { fetchPersistedEvents } from "@/lib/db/events";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/cron/social-post
 * Generates daily social media post content from top intelligence events.
 * Runs daily at 12:00 UTC via Vercel Cron.
 *
 * Posts to Twitter/X and Bluesky via their APIs.
 * If API keys aren't set, stores the post for manual sharing.
 *
 * Schedule: "0 12 * * *"
 */

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

async function postToTwitter(text: string): Promise<boolean> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) return false;

  try {
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    return res.ok;
  } catch (err) {
    console.error("[cron/social-post]", err);
    return false;
  }
}

async function postToBluesky(text: string): Promise<boolean> {
  const handle = process.env.BLUESKY_HANDLE;
  const appPassword = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !appPassword) return false;

  try {
    // Create session
    const sessionRes = await fetch(
      "https://bsky.social/xrpc/com.atproto.server.createSession",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: handle, password: appPassword }),
      }
    );
    if (!sessionRes.ok) return false;
    const session = (await sessionRes.json()) as { did: string; accessJwt: string };

    // Create post
    const postRes = await fetch(
      "https://bsky.social/xrpc/com.atproto.repo.createRecord",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessJwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo: session.did,
          collection: "app.bsky.feed.post",
          record: {
            $type: "app.bsky.feed.post",
            text,
            createdAt: new Date().toISOString(),
          },
        }),
      }
    );
    return postRes.ok;
  } catch (err) {
    console.error("[cron/social-post]", err);
    return false;
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch top events from last 24h
    const events = await fetchPersistedEvents({ limit: 50, hoursBack: 24 });

    if (events.length < 3) {
      return NextResponse.json({
        success: false,
        error: "Not enough events to generate social post",
      });
    }

    // Count by severity
    const critical = events.filter((e) => e.severity === "critical").length;
    const high = events.filter((e) => e.severity === "high").length;

    // Top 5 headlines
    const topHeadlines = events
      .slice(0, 5)
      .map((e, i) => `${i + 1}. [${e.category.toUpperCase()}] ${e.title}`)
      .join("\n");

    // Generate concise social post via AI
    const { text: postContent } = await generateText({
      model: briefModel,
      system: `You are WorldScope social media manager. Write a concise, engaging tweet-length post (max 270 chars) summarizing today's top intelligence events. Use data-driven tone. End with "troiamedia.com" link. No hashtags. No emojis.`,
      prompt: `Today's intelligence summary:
Events: ${events.length} total, ${critical} critical, ${high} high severity
Top headlines:
${topHeadlines}`,
    });

    // Post to platforms
    const twitterOk = await postToTwitter(postContent);
    const blueskyOk = await postToBluesky(postContent);

    return NextResponse.json({
      success: true,
      post: postContent,
      posted: {
        twitter: twitterOk,
        bluesky: blueskyOk,
      },
      eventCount: events.length,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
