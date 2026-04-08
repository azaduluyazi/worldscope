import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/supabase";
import {
  analyzeSignalMix,
  type SourceHit,
} from "@/lib/convergence/signal-mix";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

/**
 * GET /api/admin/signal-mix?hours=24
 *
 * Returns a signal-mix diagnostic report computed from the events table.
 * Used by the admin dashboard (Signal Mix tab) and by the daily Telegram
 * alert cron.
 *
 * Auth: ?key= query param or x-admin-key header against process.env.ADMIN_KEY.
 */

function isAuthorized(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return false;
  const provided =
    request.headers.get("x-admin-key") ||
    request.nextUrl.searchParams.get("key");
  return provided === adminKey;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hours = Math.max(
    1,
    Math.min(168, Number(request.nextUrl.searchParams.get("hours") || "24"))
  );
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  try {
    const db = createServerClient();

    // Group events by source over the window.
    // Supabase doesn't support GROUP BY in the REST API, so we pull the
    // raw source column and aggregate client-side. At ~10K events/24h
    // this is trivially cheap.
    const { data, error } = await db
      .from("events")
      .select("source")
      .gte("published_at", since)
      .limit(20000);

    if (error) {
      console.error("[signal-mix] DB error:", error.message);
      return NextResponse.json(
        { status: "error", error: "Failed to query events" },
        { status: 500 }
      );
    }

    // Aggregate in memory
    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      counts.set(row.source, (counts.get(row.source) ?? 0) + 1);
    }

    const hits: SourceHit[] = Array.from(counts.entries()).map(
      ([source, count]) => ({ source, count })
    );

    const report = analyzeSignalMix(hits, hours);

    return NextResponse.json({
      status: "success",
      data: {
        ...report,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[signal-mix] unexpected error:", msg);
    return NextResponse.json(
      { status: "error", error: msg },
      { status: 500 }
    );
  }
}
