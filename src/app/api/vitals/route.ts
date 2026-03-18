import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/vitals — Receives Web Vitals metrics from client.
 * Stores recent metrics in-memory for the /api/health endpoint.
 * In production, this could forward to Datadog, New Relic, etc.
 */

interface VitalEntry {
  name: string;
  value: number;
  rating?: string;
  path: string;
  timestamp: number;
}

/** In-memory ring buffer — last 100 vitals entries */
const BUFFER_SIZE = 100;
const vitalsBuffer: VitalEntry[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry: VitalEntry = {
      name: body.name,
      value: body.value,
      rating: body.rating,
      path: body.path || "/",
      timestamp: body.timestamp || Date.now(),
    };

    // Ring buffer — evict oldest if full
    if (vitalsBuffer.length >= BUFFER_SIZE) {
      vitalsBuffer.shift();
    }
    vitalsBuffer.push(entry);

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

/**
 * GET /api/vitals — Returns aggregated Web Vitals summary.
 * Useful for monitoring dashboards.
 */
export async function GET() {
  const now = Date.now();
  const oneHourAgo = now - 3600_000;

  // Filter to last hour
  const recent = vitalsBuffer.filter((v) => v.timestamp > oneHourAgo);

  // Aggregate by metric name
  const metrics: Record<string, { count: number; sum: number; good: number; poor: number }> = {};

  for (const entry of recent) {
    if (!metrics[entry.name]) {
      metrics[entry.name] = { count: 0, sum: 0, good: 0, poor: 0 };
    }
    const m = metrics[entry.name];
    m.count++;
    m.sum += entry.value;
    if (entry.rating === "good") m.good++;
    if (entry.rating === "poor") m.poor++;
  }

  const summary = Object.fromEntries(
    Object.entries(metrics).map(([name, data]) => [
      name,
      {
        avg: Math.round(data.sum / data.count),
        count: data.count,
        goodPercent: Math.round((data.good / data.count) * 100),
        poorPercent: Math.round((data.poor / data.count) * 100),
      },
    ])
  );

  return NextResponse.json({
    period: "last_hour",
    totalEntries: recent.length,
    bufferSize: vitalsBuffer.length,
    metrics: summary,
  });
}
