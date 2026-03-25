import { NextResponse } from "next/server";
import { getApiRegistry } from "@/config/api-registry";
import { redis } from "@/lib/cache/redis";
import { createServerClient } from "@/lib/db/supabase";

export const runtime = "nodejs";

const DISABLED_SOURCES_KEY = "disabled-sources";

const CATEGORY_TO_VARIANT: Record<string, string[]> = {
  conflict: ["WorldScope", "ConflictScope"],
  finance: ["WorldScope", "FinScope", "CommodityScope"],
  cyber: ["WorldScope", "CyberScope", "TechScope"],
  tech: ["WorldScope", "TechScope"],
  natural: ["WorldScope", "WeatherScope"],
  aviation: ["WorldScope", "ConflictScope"],
  energy: ["WorldScope", "EnergyScope", "CommodityScope"],
  diplomacy: ["WorldScope", "ConflictScope", "GoodScope"],
  protest: ["WorldScope", "ConflictScope"],
  health: ["WorldScope", "HealthScope", "WeatherScope"],
  sports: ["WorldScope", "SportsScope"],
};

interface UnifiedSource {
  id: string;
  name: string;
  type: "api" | "rss";
  url: string;
  category: string;
  variants: string[];
  status: "active" | "disabled" | "no_key" | "error";
  enabled: boolean;
  tags: string[];
  provider: string;
  plan?: string;
  rateLimit?: string;
  envKey?: string;
  language?: string;
  region?: string;
  errorCount?: number;
}

/** GET /api/admin/sources — unified list of all sources (API + RSS) */
export async function GET() {
  try {
    // 1. Fetch disabled sources from Redis
    const disabledRaw = await redis.get<string[]>(DISABLED_SOURCES_KEY);
    const disabledSet = new Set<string>(disabledRaw || []);

    // 2. Get API sources
    const apiRegistry = getApiRegistry();
    const apiSources: UnifiedSource[] = apiRegistry.map((api) => {
      const id = `api:${api.name.toLowerCase().replace(/\s+/g, "-")}`;
      const catLower = api.category.toLowerCase();
      const tags: string[] = [api.category.toLowerCase(), api.plan];
      if (api.notes) {
        // Extract keywords from notes
        const noteWords = api.notes
          .toLowerCase()
          .split(/[\s,—–-]+/)
          .filter((w) => w.length > 3 && !["with", "from", "that", "this", "free", "tier"].includes(w));
        tags.push(...noteWords.slice(0, 5));
      }
      const isDisabled = disabledSet.has(id);
      let status: UnifiedSource["status"] = api.status === "no_key" ? "no_key" : "active";
      if (isDisabled) status = "disabled";

      return {
        id,
        name: api.name,
        type: "api" as const,
        url: api.url,
        category: api.category,
        variants: CATEGORY_TO_VARIANT[catLower] || ["WorldScope"],
        status,
        enabled: !isDisabled,
        tags: [...new Set(tags)],
        provider: api.provider,
        plan: api.plan,
        rateLimit: api.rateLimit,
        envKey: api.envKey,
      };
    });

    // 3. Get RSS feeds from Supabase
    let rssSources: UnifiedSource[] = [];
    try {
      const db = createServerClient();
      const { data: feeds } = await db
        .from("feeds")
        .select("id, name, url, category, language, region, is_active, error_count")
        .order("name");

      if (feeds) {
        rssSources = feeds.map((feed) => {
          const id = `rss:${feed.id}`;
          const catLower = (feed.category || "").toLowerCase();
          const isDisabled = disabledSet.has(id);
          const hasErrors = (feed.error_count || 0) >= 5;
          let status: UnifiedSource["status"] = feed.is_active ? "active" : "disabled";
          if (hasErrors) status = "error";
          if (isDisabled) status = "disabled";

          const tags: string[] = [catLower];
          if (feed.language) tags.push(feed.language);
          if (feed.region) tags.push(feed.region);

          return {
            id,
            name: feed.name,
            type: "rss" as const,
            url: feed.url,
            category: feed.category || "unknown",
            variants: CATEGORY_TO_VARIANT[catLower] || ["WorldScope"],
            status,
            enabled: !isDisabled && feed.is_active,
            tags: [...new Set(tags)],
            provider: new URL(feed.url).hostname.replace("www.", ""),
            language: feed.language,
            region: feed.region,
            errorCount: feed.error_count || 0,
          };
        });
      }
    } catch {
      // Supabase may fail — continue with API sources only
    }

    const allSources = [...apiSources, ...rssSources];

    // 4. Compute summary stats
    const summary = {
      total: allSources.length,
      api: apiSources.length,
      rss: rssSources.length,
      active: allSources.filter((s) => s.status === "active").length,
      disabled: allSources.filter((s) => s.status === "disabled" || !s.enabled).length,
      noKey: allSources.filter((s) => s.status === "no_key").length,
      error: allSources.filter((s) => s.status === "error").length,
      byCategory: Object.entries(
        allSources.reduce<Record<string, number>>((acc, s) => {
          const cat = s.category.toLowerCase();
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .reduce<Record<string, number>>((acc, [k, v]) => {
          acc[k] = v;
          return acc;
        }, {}),
    };

    return NextResponse.json({ sources: allSources, summary });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch sources", detail: String(err) },
      { status: 500 }
    );
  }
}
