import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchAllCyberThreats } from "@/lib/api/cyber-threats";

export const runtime = "nodejs";
export const maxDuration = 30;

/** GET /api/cyber-threats — Feodo Tracker + URLhaus + OTX AlienVault */
export async function GET() {
  try {
    const threats = await cachedFetch("cyber:threats", fetchAllCyberThreats, 600);
    return NextResponse.json({ threats, total: threats.length, lastUpdated: new Date().toISOString() });
  } catch {
    return NextResponse.json({ threats: [], total: 0 }, { status: 500 });
  }
}
