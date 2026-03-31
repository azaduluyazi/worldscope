import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, checkKeyRateLimit } from "@/lib/api-keys";
import { createServerClient } from "@/lib/db/supabase";
import { cachedFetch, TTL } from "@/lib/cache/redis";

export const runtime = "nodejs";

/**
 * GET /api/v1/countries/:code
 *
 * Public Developer API — requires valid API key in Authorization: Bearer header.
 * Returns country risk data: risk score, recent events, active conflicts, severity breakdown.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
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

  const { code } = await params;
  const countryCode = code.toUpperCase();

  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return NextResponse.json(
      { error: "Invalid country code. Use ISO 3166-1 alpha-2 (e.g., US, TR, UA)" },
      { status: 400 }
    );
  }

  const cacheKey = `v1:country:${countryCode}`;

  try {
    const result = await cachedFetch(
      cacheKey,
      async () => {
        const db = createServerClient();

        // Events from the last 7 days for this country
        const weekAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString();

        const { data: events, error } = await db
          .from("events")
          .select("id, category, severity, published_at")
          .eq("country_code", countryCode)
          .gte("published_at", weekAgo)
          .order("published_at", { ascending: false });

        if (error) {
          console.error("[v1/countries] Supabase error:", error);
          return null;
        }

        const items = events || [];

        // Severity breakdown
        const severityBreakdown: Record<string, number> = {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
        };
        for (const e of items) {
          if (e.severity in severityBreakdown) {
            severityBreakdown[e.severity]++;
          }
        }

        // Category breakdown
        const categoryBreakdown: Record<string, number> = {};
        for (const e of items) {
          categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + 1;
        }

        // Risk score: weighted severity count (0-100)
        const weights = { critical: 10, high: 5, medium: 2, low: 0.5, info: 0 };
        const rawScore = items.reduce((sum, e) => {
          return sum + (weights[e.severity as keyof typeof weights] || 0);
        }, 0);
        const riskScore = Math.min(Math.round(rawScore), 100);

        const riskLevel =
          riskScore >= 75
            ? "critical"
            : riskScore >= 50
              ? "high"
              : riskScore >= 25
                ? "medium"
                : riskScore >= 10
                  ? "low"
                  : "minimal";

        return {
          country: countryCode,
          riskScore,
          riskLevel,
          eventsLast7Days: items.length,
          activeConflicts: severityBreakdown.critical + severityBreakdown.high,
          severityBreakdown,
          categoryBreakdown,
          lastEvent: items[0]?.published_at || null,
          period: {
            start: weekAgo,
            end: new Date().toISOString(),
          },
        };
      },
      TTL.MEDIUM
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to fetch country data" },
        { status: 500 }
      );
    }

    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Limit": String(keyRecord.rate_limit),
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (e) {
    console.error("[v1/countries] Error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
