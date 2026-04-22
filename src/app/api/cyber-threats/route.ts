import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchAllCyberThreats } from "@/lib/api/cyber-threats";
import { seedRead } from "@/lib/seed/seed-utils";
import { SEED_KEYS } from "@/lib/cache/keys";

export const runtime = "nodejs";
export const maxDuration = 30;

/** GET /api/cyber-threats — Feodo Tracker + URLhaus + OTX AlienVault */
export async function GET() {
  try {
    // Seed-first: try pre-populated cache
    const seeded = await seedRead<unknown[]>(SEED_KEYS.cyber.threats);
    if (seeded) {
      return NextResponse.json({ threats: seeded, total: seeded.length, lastUpdated: new Date().toISOString(), fromSeed: true });
    }

    const threats = await cachedFetch("cyber:threats", fetchAllCyberThreats, 600);
    return NextResponse.json({ threats, total: threats.length, lastUpdated: new Date().toISOString() });
  } catch (err) {
    console.error("[cyber-threats]", err);
    return NextResponse.json({ threats: [], total: 0 }, { status: 500 });
  }
}
