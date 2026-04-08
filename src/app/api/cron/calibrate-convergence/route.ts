import { NextResponse } from "next/server";
import { fetchCtrBuckets } from "@/lib/db/telemetry";
import { runCalibrationCycle } from "@/lib/convergence/calibration";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/cron/calibrate-convergence
 *
 * Runs weekly. Reads telemetry CTR buckets, computes the calibration
 * error, and adjusts the Bayesian prior stored in Redis. The engine
 * picks up the new prior on the next cycle.
 *
 * This is the feedback loop that makes the scorer data-driven.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const buckets = await fetchCtrBuckets();
    if (buckets.length === 0) {
      return NextResponse.json({
        status: "ok",
        message: "No telemetry buckets available yet — skipping calibration",
      });
    }

    const record = await runCalibrationCycle(buckets);
    if (!record) {
      return NextResponse.json({
        status: "ok",
        message: "Insufficient data for calibration (< 30 samples per bucket)",
      });
    }

    return NextResponse.json({
      status: "ok",
      calibration: record,
    });
  } catch (err) {
    console.error("[calibrate-convergence] error:", err);
    return NextResponse.json(
      { status: "error", error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
