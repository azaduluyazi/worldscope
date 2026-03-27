import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchImfGdpGrowth, fetchImfInflation } from "@/lib/api/imf";
import { fetchBigMacIndex } from "@/lib/api/bigmac";
import { fetchBisPolicyRates } from "@/lib/api/bis";
import { fetchFREDData } from "@/lib/api/fred";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/economics?type=gdp|inflation|bigmac|rates|all
 * Returns global economic indicators from IMF, Big Mac Index, BIS.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all";

  try {
    const result: Record<string, unknown> = {};

    if (type === "all" || type === "gdp") {
      result.gdp = await cachedFetch("econ:gdp", () => fetchImfGdpGrowth(), 3600);
    }

    if (type === "all" || type === "inflation") {
      result.inflation = await cachedFetch("econ:inflation", () => fetchImfInflation(), 3600);
    }

    if (type === "all" || type === "bigmac") {
      result.bigmac = await cachedFetch("econ:bigmac", () => fetchBigMacIndex(), 86400); // 24h cache
    }

    if (type === "all" || type === "rates") {
      result.policyRates = await cachedFetch("econ:rates", () => fetchBisPolicyRates(), 3600);
    }

    if (type === "all" || type === "fred") {
      result.fred = await cachedFetch("econ:fred", () => fetchFREDData(), 3600);
    }

    return NextResponse.json({
      ...result,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch economic data" }, { status: 500 });
  }
}
