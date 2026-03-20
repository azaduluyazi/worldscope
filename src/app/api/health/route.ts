import { NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";

export const runtime = "nodejs";

/**
 * GET /api/health — Comprehensive health check endpoint.
 * Returns system status for monitoring (Vercel, UptimeRobot, BetterStack, etc.).
 *
 * Response codes:
 * - 200: healthy or degraded (still functional)
 * - 503: unhealthy (critical services down)
 */
export async function GET() {
  const env = validateEnv();
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();

  // Check external service connectivity
  const checks: Record<string, { status: string; latency?: number }> = {};

  // Supabase check
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const start = Date.now();
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "" },
        signal: AbortSignal.timeout(5000),
      });
      checks.supabase = { status: res.ok ? "connected" : "error", latency: Date.now() - start };
    } catch {
      checks.supabase = { status: "unreachable", latency: Date.now() - start };
    }
  } else {
    checks.supabase = { status: "not_configured" };
  }

  // Redis/Upstash check — use PING command via REST API
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    const start = Date.now();
    try {
      // Upstash REST API: POST with ["PING"] command for proper health check
      const res = await fetch(`${redisUrl}/ping`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      const latency = Date.now() - start;
      if (res.ok) {
        checks.redis = { status: "connected", latency };
      } else {
        const errText = await res.text().catch(() => "unknown");
        checks.redis = { status: `error (${res.status}: ${errText.slice(0, 50)})`, latency };
      }
    } catch (err) {
      checks.redis = {
        status: err instanceof DOMException ? "timeout" : "unreachable",
        latency: Date.now() - start,
      };
    }
  } else {
    checks.redis = { status: "not_configured" };
  }

  const criticalDown = checks.supabase?.status === "unreachable";
  const status = criticalDown ? "unhealthy" : env.valid ? "healthy" : "degraded";

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      uptime: Math.round(uptime),
      memory: {
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
      env: {
        configured: env.configured.length,
        missing: env.missing.length,
        warnings: env.warnings.length,
      },
      services: checks,
      node: process.version,
    },
    { status: criticalDown ? 503 : 200 }
  );
}
