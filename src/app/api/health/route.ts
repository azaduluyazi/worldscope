import { NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";

export const runtime = "nodejs";

/**
 * GET /api/health — Health check endpoint.
 * Returns system status for monitoring (Vercel, UptimeRobot, etc.).
 */
export async function GET() {
  const env = validateEnv();
  const uptime = process.uptime();

  return NextResponse.json({
    status: env.valid ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    uptime: Math.round(uptime),
    env: {
      configured: env.configured.length,
      missing: env.missing.length,
      warnings: env.warnings.length,
    },
    node: process.version,
  });
}
