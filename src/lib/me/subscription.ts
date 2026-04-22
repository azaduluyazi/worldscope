import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/db/supabase-server";
import { createServerClient } from "@/lib/db/supabase";
import type { Database } from "@/types/supabase.generated";

export type MySubscriptionRow =
  Database["public"]["Tables"]["subscriptions"]["Row"];

/**
 * Resolve the signed-in Supabase auth user to the underlying
 * user_profiles row and their most-recent subscription (active or
 * most-recently-ended).
 *
 * Returns:
 *   - `{ unauthorized: true }` with a 401 NextResponse ready to use
 *   - `{ noProfile: true }` if the auth user has no user_profiles row
 *     (shouldn't happen post-sign-up but we handle it)
 *   - `{ profileId, subscription }` otherwise (subscription may be null
 *     if the user is on the free tier)
 */
export async function resolveMySubscription(): Promise<
  | { unauthorized: true; response: NextResponse }
  | { noProfile: true; response: NextResponse }
  | { profileId: string; subscription: MySubscriptionRow | null }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      unauthorized: true,
      response: NextResponse.json(
        { error: "sign-in required", redirect: "/sign-in" },
        { status: 401 },
      ),
    };
  }

  const db = createServerClient();
  const { data: profile, error: profileErr } = await db
    .from("user_profiles")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (profileErr) {
    return {
      unauthorized: true,
      response: NextResponse.json(
        { error: profileErr.message },
        { status: 500 },
      ),
    };
  }
  if (!profile) {
    return {
      noProfile: true,
      response: NextResponse.json(
        { error: "no user profile" },
        { status: 404 },
      ),
    };
  }

  // Pick the most recent subscription for this user (active or last).
  // In the common case the user has 0 or 1 — Lemon creates a new row
  // only when they re-subscribe after expiry.
  const { data: subscription } = await db
    .from("subscriptions")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { profileId: profile.id, subscription: subscription ?? null };
}
