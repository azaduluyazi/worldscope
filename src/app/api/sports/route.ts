import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchAllSportsScores } from "@/lib/api/espn-sports";
import { fetchFootballIntel } from "@/lib/api/football-data";
import { fetchNbaIntel } from "@/lib/api/nba-stats";
import { fetchCricketIntel } from "@/lib/api/cricket";
import { fetchF1Intel } from "@/lib/api/f1-ergast";
import { fetchOpenF1Intel } from "@/lib/api/openf1";
import { fetchTransfermarktIntel } from "@/lib/api/transfermarkt";
import type { IntelItem } from "@/types/intel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_KEY = "sports:aggregated";
const CACHE_TTL = 120;

export async function GET(req: NextRequest) {
  try {
    const rateLimited = await checkRateLimit(req);
    if (rateLimited) return rateLimited;

    const data = await cachedFetch<{ items: IntelItem[]; total: number; lastUpdated: string }>(
      CACHE_KEY,
      async () => {
        const results = await Promise.allSettled([
          fetchAllSportsScores().catch(() => []),
          fetchFootballIntel().catch(() => []),
          fetchNbaIntel().catch(() => []),
          fetchCricketIntel().catch(() => []),
          fetchF1Intel().catch(() => []),
          fetchOpenF1Intel().catch(() => []),
          fetchTransfermarktIntel().catch(() => []),
        ]);

        const items: IntelItem[] = [];
        for (const result of results) {
          if (result.status === "fulfilled" && Array.isArray(result.value)) {
            items.push(...result.value);
          }
        }

        // Deduplicate by title similarity
        const seen = new Set<string>();
        const unique = items.filter(item => {
          const key = item.title.toLowerCase().slice(0, 50);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Sort by publishedAt desc
        unique.sort((a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );

        return {
          items: unique.slice(0, 100),
          total: unique.length,
          lastUpdated: new Date().toISOString(),
        };
      },
      CACHE_TTL
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Sports API]", error);
    return NextResponse.json({ items: [], total: 0, error: "Failed to fetch sports data" }, { status: 500 });
  }
}
