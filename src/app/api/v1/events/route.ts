import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, checkKeyRateLimit } from "@/lib/api-keys";
import { createServerClient } from "@/lib/db/supabase";
import { cachedFetch, TTL } from "@/lib/cache/redis";

export const runtime = "nodejs";

/**
 * GET /api/v1/events
 *
 * Public Developer API — requires valid API key in Authorization: Bearer header.
 *
 * Query params:
 *   category  — filter by category (conflict, finance, cyber, tech, natural, etc.)
 *   severity  — filter by severity (critical, high, medium, low, info)
 *   country   — filter by 2-letter country code
 *   limit     — results per page (1-100, default 50)
 *   offset    — pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  // ── Extract and validate API key ──
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Authorization: Bearer <api_key> header" },
      { status: 401 }
    );
  }

  const apiKey = authHeader.slice(7).trim();
  const keyRecord = await validateApiKey(apiKey);

  if (!keyRecord) {
    return NextResponse.json(
      { error: "Invalid or inactive API key" },
      { status: 401 }
    );
  }

  // ── Per-key rate limiting ──
  const { allowed, remaining } = await checkKeyRateLimit(
    keyRecord.id,
    keyRecord.rate_limit
  );

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        limit: keyRecord.rate_limit,
        resetIn: "1 hour",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(keyRecord.rate_limit),
          "X-RateLimit-Remaining": "0",
          "Retry-After": "3600",
        },
      }
    );
  }

  // ── Parse query params ──
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const severity = searchParams.get("severity");
  const country = searchParams.get("country");
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);

  // ── Fetch events (cached) ──
  const cacheKey = `v1:events:${category || "all"}:${severity || "all"}:${country || "all"}:${limit}:${offset}`;

  try {
    const result = await cachedFetch(
      cacheKey,
      async () => {
        const db = createServerClient();
        let query = db
          .from("events")
          .select("id, title, summary, category, severity, country_code, source, published_at, lat, lng", { count: "exact" });

        if (category) query = query.eq("category", category);
        if (severity) query = query.eq("severity", severity);
        if (country) query = query.eq("country_code", country.toUpperCase());

        query = query
          .order("published_at", { ascending: false })
          .range(offset, offset + limit - 1);

        const { data, count, error } = await query;

        if (error) {
          console.error("[v1/events] Supabase error:", error);
          return { events: [], total: 0 };
        }

        return {
          events: (data || []).map((e) => ({
            id: e.id,
            title: e.title,
            summary: e.summary || undefined,
            category: e.category,
            severity: e.severity,
            country: e.country_code,
            source: e.source,
            timestamp: e.published_at,
            lat: e.lat || undefined,
            lng: e.lng || undefined,
          })),
          total: count || 0,
        };
      },
      TTL.MEDIUM
    );

    return NextResponse.json(
      {
        ...result,
        page: Math.floor(offset / limit) + 1,
        limit,
        offset,
      },
      {
        headers: {
          "X-RateLimit-Limit": String(keyRecord.rate_limit),
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    );
  } catch (e) {
    console.error("[v1/events] Error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
