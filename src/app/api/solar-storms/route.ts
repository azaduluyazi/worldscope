import { NextResponse } from "next/server";
import { fetchSolarAlerts } from "@/lib/api/noaa-solar";

export const runtime = "nodejs";
export const revalidate = 300; // 5 min

export async function GET() {
  try {
    const items = await fetchSolarAlerts();
    return NextResponse.json({ items, total: items.length });
  } catch {
    return NextResponse.json({ items: [], total: 0, error: "Failed to fetch solar alerts" }, { status: 500 });
  }
}
