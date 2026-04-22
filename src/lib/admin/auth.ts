import { NextResponse } from "next/server";

/**
 * Shared admin bearer-token guard. Every /api/admin/* route should
 * call this as its first line and early-return on the response.
 *
 * Fail-closed: missing `ADMIN_KEY` env = 503. Wrong header = 401.
 * On success returns `null` and the route continues.
 */
export function requireAdmin(request: Request): NextResponse | null {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    return NextResponse.json(
      { error: "Admin not configured" },
      { status: 503 },
    );
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
