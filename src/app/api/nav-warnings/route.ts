import { NextResponse } from "next/server";
import { fetchNavWarnings } from "@/lib/api/nga-warnings";

export const runtime = "nodejs";
export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    const items = await fetchNavWarnings();
    return NextResponse.json({ items, total: items.length });
  } catch {
    return NextResponse.json({ items: [], total: 0, error: "Failed to fetch navigational warnings" }, { status: 500 });
  }
}
