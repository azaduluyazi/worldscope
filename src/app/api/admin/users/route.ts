import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: users, error } = await supabase
      .from("user_profiles")
      .select("*, subscriptions(plan, status)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      users: (users || []).map((u: Record<string, unknown>) => ({
        ...u,
        subscription: Array.isArray(u.subscriptions) ? u.subscriptions[0] : null,
      })),
      total: users?.length || 0,
    });
  } catch (err) {
    return NextResponse.json({ users: [], total: 0, error: "Failed to fetch users" }, { status: 500 });
  }
}
