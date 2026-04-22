import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchMultiLanguageTrending } from "@/lib/api/github-trending";
import { fetchArxivPapers } from "@/lib/api/arxiv";
import { fetchHackerNews } from "@/lib/api/hackernews";

export const runtime = "nodejs";

/**
 * GET /api/trending?type=github|arxiv|hackernews|all
 * Tech community pulse — trending repos, papers, and discussions.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all";

  try {
    const result: Record<string, unknown> = {};

    if (type === "all" || type === "github") {
      result.github = await cachedFetch(
        "trending:github",
        () => fetchMultiLanguageTrending(),
        1800 // 30 min cache
      );
    }

    if (type === "all" || type === "arxiv") {
      result.arxiv = await cachedFetch(
        "trending:arxiv",
        () => fetchArxivPapers("cs.AI", 10),
        3600 // 1h cache
      );
    }

    if (type === "all" || type === "hackernews") {
      result.hackernews = await cachedFetch(
        "trending:hn",
        () => fetchHackerNews(15),
        600 // 10 min cache
      );
    }

    return NextResponse.json({
      ...result,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[trending]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
