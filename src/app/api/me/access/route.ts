/**
 * GET /api/me/access — returns the caller's current tier.
 *
 * Used by client components (e.g. <WorldScopeChat>) to decide whether
 * to render the full feature or a paywall upsell. Auth-only; anonymous
 * visitors get FREE_CONTEXT.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/db/supabase-server";
import { resolveAccess, FREE_CONTEXT } from "@/lib/subscriptions/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(FREE_CONTEXT);
  }
  const access = await resolveAccess(user.id);
  return NextResponse.json(access);
}
