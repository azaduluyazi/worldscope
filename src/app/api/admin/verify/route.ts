import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** POST /api/admin/verify — verify admin key */
export async function POST(request: Request) {
  try {
    const { key } = await request.json();
    const adminKey = process.env.ADMIN_KEY;

    if (!adminKey) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
    }

    if (key === adminKey) {
      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ verified: false, error: "Invalid key" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
