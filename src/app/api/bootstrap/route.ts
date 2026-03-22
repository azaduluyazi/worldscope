import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchPersistedEvents } from "@/lib/db/events";

export const runtime = "nodejs";

/**
 * GET /api/bootstrap?keys=intel,threat,market
 * Pre-loads heavy datasets in a single request.
 * Client calls this once on initial load instead of 5+ separate API calls.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keys = (searchParams.get("keys") || "intel,threat").split(",");

  const result: Record<string, unknown> = {};

  const fetchers: Array<[string, () => Promise<unknown>]> = [];

  if (keys.includes("intel")) {
    fetchers.push(["intel", () => cachedFetch(
      "bootstrap:intel",
      async () => {
        const items = await fetchPersistedEvents({ limit: 200, hoursBack: 24 });
        return { items, total: items.length };
      },
      120
    )]);
  }

  if (keys.includes("stats")) {
    fetchers.push(["stats", () => cachedFetch(
      "bootstrap:stats",
      async () => {
        const items = await fetchPersistedEvents({ limit: 1000, hoursBack: 48 });
        const categories: Record<string, number> = {};
        const severities: Record<string, number> = {};
        items.forEach(i => {
          categories[i.category] = (categories[i.category] || 0) + 1;
          severities[i.severity] = (severities[i.severity] || 0) + 1;
        });
        return { totalEvents: items.length, categories, severities };
      },
      300
    )]);
  }

  // Fetch all requested datasets in parallel
  const results = await Promise.allSettled(
    fetchers.map(async ([key, fn]) => {
      result[key] = await fn();
    })
  );

  // Log any failures
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      result[fetchers[i][0]] = null;
    }
  });

  return NextResponse.json({
    ...result,
    timestamp: new Date().toISOString(),
  });
}
