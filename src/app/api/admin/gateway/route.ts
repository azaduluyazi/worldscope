import { NextResponse } from "next/server";
import { getGatewayHealth, resetCircuit } from "@/lib/api/gateway";

export const runtime = "nodejs";

/**
 * GET /api/admin/gateway — View circuit breaker status of all data sources.
 * POST /api/admin/gateway — Reset a circuit breaker. Body: { sourceId: string }
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const health = getGatewayHealth();
  const openCircuits = health.filter((h) => h.isOpen);

  return NextResponse.json({
    sources: health,
    totalSources: health.length,
    openCircuits: openCircuits.length,
    status: openCircuits.length === 0 ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sourceId } = await request.json();
    if (!sourceId) {
      return NextResponse.json({ error: "sourceId required" }, { status: 400 });
    }
    resetCircuit(sourceId);
    return NextResponse.json({ success: true, message: `Circuit ${sourceId} reset` });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
