import { NextResponse } from "next/server";
import { cachedFetch } from "@/lib/cache/redis";
import { fetchNationalDebt, fetchFederalSpending } from "@/lib/api/fiscal-data";

export const runtime = "nodejs";

/** GET /api/fiscal — US fiscal data (national debt + federal spending) */
export async function GET() {
  try {
    const [debt, spending] = await Promise.allSettled([
      cachedFetch("data:debt", fetchNationalDebt, 3600),
      cachedFetch("data:spending", fetchFederalSpending, 3600),
    ]);

    const data = [
      ...(debt.status === "fulfilled" ? debt.value : []),
      ...(spending.status === "fulfilled" ? spending.value : []),
    ];

    return NextResponse.json({ data, total: data.length, lastUpdated: new Date().toISOString() });
  } catch {
    return NextResponse.json({ data: [], total: 0 }, { status: 500 });
  }
}
