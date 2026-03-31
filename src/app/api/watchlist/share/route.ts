import { NextResponse } from "next/server";
import { redis } from "@/lib/cache/redis";

export const runtime = "nodejs";

/** 30-day TTL for shared watchlists */
const SHARE_TTL = 30 * 24 * 60 * 60; // 2,592,000 seconds

interface WatchlistItem {
  type: "country" | "category" | "region";
  value: string;
  addedAt: string;
}

function generateCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

function isValidItem(item: unknown): item is WatchlistItem {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.value === "string" &&
    typeof obj.addedAt === "string" &&
    (obj.type === "country" || obj.type === "category" || obj.type === "region")
  );
}

/**
 * POST /api/watchlist/share
 * Create a shareable watchlist link.
 * Body: { items: WatchlistItem[] }
 * Returns: { code, url }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (items.length > 200) {
      return NextResponse.json(
        { error: "Maximum 200 items allowed" },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!isValidItem(item)) {
        return NextResponse.json(
          { error: "Invalid watchlist item format. Each item needs type (country|category|region), value, and addedAt." },
          { status: 400 }
        );
      }
    }

    const code = generateCode();
    const redisKey = `watchlist:share:${code}`;

    await redis.set(redisKey, JSON.stringify(items), { ex: SHARE_TTL });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://troiamedia.com";
    const url = `${baseUrl}/share/${code}`;

    return NextResponse.json({ code, url });
  } catch (e) {
    console.error("[Watchlist Share] POST error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/watchlist/share?code=xxx
 * Retrieve a shared watchlist by code.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code || !/^[a-f0-9]{8}$/.test(code)) {
      return NextResponse.json(
        { error: "Valid 8-character code is required" },
        { status: 400 }
      );
    }

    const redisKey = `watchlist:share:${code}`;
    const raw = await redis.get<string>(redisKey);

    if (!raw) {
      return NextResponse.json(
        { error: "Watchlist not found or expired" },
        { status: 404 }
      );
    }

    const items: WatchlistItem[] = typeof raw === "string" ? JSON.parse(raw) : raw;

    return NextResponse.json({ code, items });
  } catch (e) {
    console.error("[Watchlist Share] GET error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
