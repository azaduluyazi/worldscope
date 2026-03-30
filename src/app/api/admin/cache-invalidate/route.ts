import { NextRequest, NextResponse } from "next/server";
import { invalidateGroup } from "@/lib/cache/invalidation";

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { group } = await req.json();
    if (!group) {
      return NextResponse.json({ error: "Missing group parameter" }, { status: 400 });
    }

    const result = await invalidateGroup(group);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: "Invalidation failed" }, { status: 500 });
  }
}
