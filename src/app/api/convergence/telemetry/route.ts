import { NextRequest, NextResponse } from "next/server";
import { getTelemetrySink, fetchCtrBuckets } from "@/lib/db/telemetry";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import type { TelemetryRecord } from "@/lib/convergence/telemetry";

export const runtime = "nodejs";
export const maxDuration = 10;

/**
 * POST /api/convergence/telemetry
 *   Body: TelemetryRecord OR { events: TelemetryRecord[] }
 *   Records user interactions with convergences for calibration.
 *
 *   This is the feedback loop. Every click here trains the engine.
 *   Authentication is intentionally LIGHT (no token required for
 *   anonymous tracking) but rate-limited at the middleware layer.
 */
export async function POST(request: NextRequest) {
  // Rate limit anonymous POSTs (60 req/min per IP).
  // Telemetry must be cheap to write but easy to abuse.
  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = (await request.json()) as
      | TelemetryRecord
      | { events: TelemetryRecord[] };
    const sink = getTelemetrySink();

    if ("events" in body && Array.isArray(body.events)) {
      // Sanity-check size to prevent abuse
      if (body.events.length > 100) {
        return NextResponse.json(
          { status: "error", error: "Batch too large (max 100)" },
          { status: 413 }
        );
      }
      await sink.recordBatch(body.events);
      return NextResponse.json({ status: "success", recorded: body.events.length });
    }

    // Single record
    const record = body as TelemetryRecord;
    if (!record?.convergenceId || !record?.event) {
      return NextResponse.json(
        { status: "error", error: "Missing convergenceId or event" },
        { status: 400 }
      );
    }
    await sink.record(record);
    return NextResponse.json({ status: "success", recorded: 1 });
  } catch (err) {
    console.error("[telemetry API POST] error:", err);
    return NextResponse.json(
      { status: "error", error: "Failed to record telemetry" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/convergence/telemetry
 *   Returns the rolling 7-day CTR by confidence bucket.
 *   Used by the calibration dashboard (admin only — no auth here yet,
 *   but the data is non-sensitive aggregate counts).
 */
export async function GET() {
  try {
    const buckets = await fetchCtrBuckets();
    return NextResponse.json({
      status: "success",
      data: {
        buckets,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[telemetry API GET] error:", err);
    return NextResponse.json(
      { status: "error", error: "Failed to fetch buckets" },
      { status: 500 }
    );
  }
}
