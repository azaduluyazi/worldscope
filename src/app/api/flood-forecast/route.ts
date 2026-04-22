import { NextResponse } from "next/server";
import { fetchFloodForecasts } from "@/lib/api/open-meteo-flood";

export const runtime = "nodejs";
export const revalidate = 600; // 10 min

export async function GET() {
  try {
    const items = await fetchFloodForecasts();
    return NextResponse.json({ items, total: items.length });
  } catch (err) {
    console.error("[flood-forecast]", err);
    return NextResponse.json({ items: [], total: 0, error: "Failed to fetch flood forecasts" }, { status: 500 });
  }
}
