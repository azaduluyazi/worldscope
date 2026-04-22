import { NextResponse } from "next/server";
import { fetchTsunamiWarnings } from "@/lib/api/noaa-tsunami";

export const runtime = "nodejs";
export const revalidate = 300; // 5 min

export async function GET() {
  try {
    const items = await fetchTsunamiWarnings();
    return NextResponse.json({ items, total: items.length });
  } catch (err) {
    console.error("[tsunamis]", err);
    return NextResponse.json({ items: [], total: 0, error: "Failed to fetch tsunami warnings" }, { status: 500 });
  }
}
