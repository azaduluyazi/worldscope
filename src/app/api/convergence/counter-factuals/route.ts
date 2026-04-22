import { NextResponse } from "next/server";
import { redis } from "@/lib/cache/redis";
import type { CounterFactualSignal } from "@/lib/convergence/counter-factual";
import { CONVERGENCE_KEYS } from "@/lib/cache/keys";

export const runtime = "nodejs";
export const maxDuration = 10;

/**
 * GET /api/convergence/counter-factuals
 *
 * Returns the list of counter-factual signals — predictions that
 * didn't validate within their expected window. These are anomalies
 * the engine surfaces alongside positive convergences.
 *
 * The cron route writes this list every 5 minutes after running the
 * counter-factual scan.
 */
export async function GET() {
  try {
    const signals = (await redis.get<CounterFactualSignal[]>(
      CONVERGENCE_KEYS.counterFactuals
    )) ?? [];
    return NextResponse.json({
      status: "success",
      data: {
        signals,
        count: signals.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[counter-factuals API] error:", err);
    return NextResponse.json(
      { status: "error", error: "Failed to fetch counter-factual signals" },
      { status: 500 }
    );
  }
}
