import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/cache/redis";

export const runtime = "nodejs";

const VIEWER_PREFIX = "viewers:";
const VIEWER_TTL = 300; // 5 minutes
const TOTAL_KEY = "viewers:__total__";

/**
 * POST /api/realtime/viewers
 * Increment viewer count for a page/event.
 * Body: { pageId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pageId = typeof body?.pageId === "string" ? body.pageId.slice(0, 128) : null;

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 }
      );
    }

    const key = `${VIEWER_PREFIX}${pageId}`;

    // Increment and set TTL (auto-expires after 5 min of no heartbeat)
    const count = await redis.incr(key);
    await redis.expire(key, VIEWER_TTL);

    // Also increment total tracker
    await redis.incr(TOTAL_KEY);
    await redis.expire(TOTAL_KEY, VIEWER_TTL);

    return NextResponse.json({ pageId, viewers: count });
  } catch (err) {
    console.error("[realtime/viewers]", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/realtime/viewers?pageId=xxx
 * Return current viewer count for a specific page.
 *
 * GET /api/realtime/viewers
 * Return total active viewers across all pages.
 */
export async function GET(req: NextRequest) {
  try {
    const pageId = req.nextUrl.searchParams.get("pageId");

    if (pageId) {
      const key = `${VIEWER_PREFIX}${pageId}`;
      const count = (await redis.get<number>(key)) ?? 0;
      return NextResponse.json({ pageId, viewers: count });
    }

    // Total active viewers — read the total key
    const total = (await redis.get<number>(TOTAL_KEY)) ?? 0;
    return NextResponse.json({ viewers: total });
  } catch (err) {
    console.error("[realtime/viewers]", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
