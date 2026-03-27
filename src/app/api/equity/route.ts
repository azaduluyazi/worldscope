import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import {
  fetchFinnhubQuote,
  fetchCompanyProfile,
  fetchPriceTarget,
  fetchRecommendation,
  fetchFinnhubNews,
} from "@/lib/api/finnhub";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get("symbol");
  if (!symbol)
    return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    const data = await cachedFetch(
      `equity:${symbol.toUpperCase()}`,
      async () => {
        const [quote, profile, target, recommendations, news] =
          await Promise.allSettled([
            fetchFinnhubQuote(symbol),
            fetchCompanyProfile(symbol),
            fetchPriceTarget(symbol),
            fetchRecommendation(symbol),
            fetchFinnhubNews("general"),
          ]);
        return {
          quote: quote.status === "fulfilled" ? quote.value : null,
          profile: profile.status === "fulfilled" ? profile.value : null,
          target: target.status === "fulfilled" ? target.value : null,
          recommendations:
            recommendations.status === "fulfilled"
              ? recommendations.value
              : [],
          news:
            news.status === "fulfilled" ? news.value.slice(0, 5) : [],
        };
      },
      60,
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      quote: null,
      profile: null,
      target: null,
      recommendations: [],
      news: [],
    });
  }
}
