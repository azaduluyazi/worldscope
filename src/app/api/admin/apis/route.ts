import { NextResponse } from "next/server";
import { getApiRegistry } from "@/config/api-registry";

export const runtime = "nodejs";

/** GET /api/admin/apis — list all API sources with status */
export async function GET() {
  const apis = getApiRegistry();

  const summary = {
    total: apis.length,
    active: apis.filter((a) => a.status === "active").length,
    noKey: apis.filter((a) => a.status === "no_key").length,
    open: apis.filter((a) => a.plan === "open").length,
    keyed: apis.filter((a) => a.plan !== "open").length,
  };

  return NextResponse.json({ apis, summary });
}
