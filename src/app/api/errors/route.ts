import { NextRequest, NextResponse } from "next/server";
import { trackError, errorBuffer } from "@/lib/error-tracking";

export const runtime = "nodejs";

/**
 * POST /api/errors — Receives client-side errors.
 * Stores in-memory buffer for monitoring via GET.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    trackError({
      message: body.message || "Unknown error",
      stack: body.stack,
      source: body.source || "client",
      path: body.path || "/",
      timestamp: body.timestamp || Date.now(),
      userAgent: req.headers.get("user-agent") || undefined,
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[errors]", err);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

/**
 * GET /api/errors — Returns recent error log for monitoring.
 */
export async function GET() {
  const now = Date.now();
  const oneHourAgo = now - 3600_000;
  const recent = errorBuffer.filter((e) => e.timestamp > oneHourAgo);

  // Group by message
  const grouped: Record<string, { count: number; lastSeen: number; source: string; path: string }> = {};
  for (const err of recent) {
    const key = err.message.slice(0, 100);
    if (!grouped[key]) {
      grouped[key] = { count: 0, lastSeen: 0, source: err.source, path: err.path };
    }
    grouped[key].count++;
    if (err.timestamp > grouped[key].lastSeen) {
      grouped[key].lastSeen = err.timestamp;
    }
  }

  const topErrors = Object.entries(grouped)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 20)
    .map(([message, data]) => ({
      message,
      ...data,
      lastSeen: new Date(data.lastSeen).toISOString(),
    }));

  return NextResponse.json({
    period: "last_hour",
    totalErrors: recent.length,
    bufferSize: errorBuffer.length,
    topErrors,
  });
}
