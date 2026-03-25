import { NextResponse } from "next/server";
import { redis } from "@/lib/cache/redis";

export const runtime = "nodejs";

const DISABLED_SOURCES_KEY = "disabled-sources";

/** POST /api/admin/sources/toggle — enable/disable a source */
export async function POST(request: Request) {
  try {
    // Verify admin key
    const adminKey = request.headers.get("x-admin-key");
    const secret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
    if (!secret || adminKey !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sourceId, enabled } = body as { sourceId: string; enabled: boolean };

    if (!sourceId || typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "sourceId (string) and enabled (boolean) required" },
        { status: 400 }
      );
    }

    // Read current disabled list
    const disabledRaw = await redis.get<string[]>(DISABLED_SOURCES_KEY);
    const disabled = new Set<string>(disabledRaw || []);

    if (enabled) {
      disabled.delete(sourceId);
    } else {
      disabled.add(sourceId);
    }

    // Persist to Redis (no expiry — persistent config)
    await redis.set(DISABLED_SOURCES_KEY, [...disabled]);

    return NextResponse.json({
      success: true,
      sourceId,
      enabled,
      totalDisabled: disabled.size,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to toggle source", detail: String(err) },
      { status: 500 }
    );
  }
}
