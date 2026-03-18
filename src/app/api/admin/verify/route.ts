import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** POST /api/admin/verify — verify admin key */
export async function POST(request: Request) {
  try {
    const { key } = await request.json();
    const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;

    if (!adminSecret) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
    }

    if (key === adminSecret) {
      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ verified: false, error: "Invalid key" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
