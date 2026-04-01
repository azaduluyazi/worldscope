import { NextResponse } from "next/server";
import { fetchIcebergs } from "@/lib/api/noaa-icebergs";

export const runtime = "nodejs";
export const revalidate = 21600; // 6 hours

export async function GET() {
  try {
    const items = await fetchIcebergs();
    return NextResponse.json({ items, total: items.length });
  } catch {
    return NextResponse.json({ items: [], total: 0, error: "Failed to fetch iceberg data" }, { status: 500 });
  }
}
