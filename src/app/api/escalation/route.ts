import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export const runtime = "nodejs";

interface RegionEscalation {
  region: string;
  label: string;
  current24h: number;
  previous24h: number;
  trend: "rising" | "stable" | "declining";
  change: number;
}

const REGIONS = [
  { code: "middle_east", label: "MIDDLE EAST", countries: ["IL", "PS", "LB", "SY", "IQ", "IR", "YE", "SA", "JO", "AE"] },
  { code: "europe", label: "EUROPE", countries: ["UA", "RU", "DE", "FR", "GB", "PL", "RO", "BY", "MD"] },
  { code: "asia", label: "ASIA", countries: ["CN", "TW", "KR", "KP", "JP", "IN", "PK", "AF", "MM"] },
  { code: "africa", label: "AFRICA", countries: ["SD", "ET", "SO", "CD", "ML", "NE", "BF", "NG", "LY"] },
  { code: "americas", label: "AMERICAS", countries: ["US", "MX", "CO", "VE", "BR", "CU", "HT", "EC"] },
];

export async function GET() {
  try {
    const db = getSupabase();
    const now = new Date();
    const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const h48ago = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    // Fetch all critical/high events from last 48h
    const { data: events } = await db
      .from("events")
      .select("severity, country_code, published_at")
      .in("severity", ["critical", "high"])
      .gte("published_at", h48ago)
      .order("published_at", { ascending: false })
      .limit(1000);

    const allEvents = events || [];

    const regions: RegionEscalation[] = REGIONS.map((region) => {
      const regionEvents = allEvents.filter((e) =>
        e.country_code && region.countries.includes(e.country_code)
      );

      const current24h = regionEvents.filter(
        (e) => new Date(e.published_at) >= new Date(h24ago)
      ).length;

      const previous24h = regionEvents.filter(
        (e) => new Date(e.published_at) < new Date(h24ago)
      ).length;

      const change = previous24h > 0
        ? Math.round(((current24h - previous24h) / previous24h) * 100)
        : current24h > 0 ? 100 : 0;

      const trend: "rising" | "stable" | "declining" =
        change > 15 ? "rising" : change < -15 ? "declining" : "stable";

      return {
        region: region.code,
        label: region.label,
        current24h,
        previous24h,
        trend,
        change,
      };
    });

    const globalTotal = regions.reduce((sum, r) => sum + r.current24h, 0);

    return NextResponse.json({ regions, globalTotal, timestamp: now.toISOString() });
  } catch (err) {
    console.error("[escalation]", err);
    return NextResponse.json({ regions: [], globalTotal: 0, error: "Failed" }, { status: 500 });
  }
}
