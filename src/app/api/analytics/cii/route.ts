import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchPersistedEvents } from "@/lib/db/events";
import { calculateCII } from "@/lib/analytics/country-instability";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const country = url.searchParams.get("country");
  const top = parseInt(url.searchParams.get("top") || "20", 10);

  try {
    const data = await cachedFetch(
      `analytics:cii:${country || "all"}`,
      async () => {
        const items = await fetchPersistedEvents({ limit: 2000, hoursBack: 168 }); // 7 days
        const risks = calculateCII(items);
        if (country) {
          return risks.filter((r) => r.countryCode === country.toUpperCase());
        }
        return risks.slice(0, Math.min(top, 50));
      },
      1800 // 30 min cache
    );
    return NextResponse.json({ countries: data, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[analytics/cii]", err);
    return NextResponse.json({ countries: [], timestamp: new Date().toISOString() });
  }
}
