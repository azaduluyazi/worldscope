import { NextRequest, NextResponse } from "next/server";
import { fetchCtrBuckets } from "@/lib/db/telemetry";
import {
  fetchCalibrationHistory,
  getCalibratedPrior,
} from "@/lib/convergence/calibration";
import { findCalibrationAnomalies } from "@/lib/convergence/telemetry";

export const runtime = "nodejs";
export const maxDuration = 15;

function isAuthorized(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return false;
  const provided = request.headers.get("x-admin-key") ||
    request.nextUrl.searchParams.get("key");
  return provided === adminKey;
}

/**
 * GET /api/admin/convergence-calibration
 *
 * Returns the full calibration dashboard payload:
 *   - current prior (from Redis)
 *   - CTR buckets (from convergence_telemetry view)
 *   - calibration anomalies (bucket inversions)
 *   - calibration history (past adjustments)
 *
 * Auth: x-admin-key header or ?key= query param.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [currentPrior, buckets, history] = await Promise.all([
      getCalibratedPrior(),
      fetchCtrBuckets(),
      fetchCalibrationHistory(),
    ]);

    const anomalies = findCalibrationAnomalies(buckets);

    return NextResponse.json({
      status: "success",
      data: {
        currentPrior,
        buckets,
        anomalies,
        history,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[admin.calibration] error:", err);
    return NextResponse.json(
      { status: "error", error: "Failed to fetch calibration data" },
      { status: 500 }
    );
  }
}
