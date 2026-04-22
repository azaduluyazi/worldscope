import { NextResponse } from "next/server";
import { fetchAuroraForecast } from "@/lib/api/noaa-aurora";

export const runtime = "nodejs";
export const revalidate = 600; // 10 min

export async function GET() {
  try {
    const items = await fetchAuroraForecast();
    return NextResponse.json({ items, total: items.length });
  } catch (err) {
    console.error("[aurora]", err);
    return NextResponse.json({ items: [], total: 0, error: "Failed to fetch aurora forecast" }, { status: 500 });
  }
}
