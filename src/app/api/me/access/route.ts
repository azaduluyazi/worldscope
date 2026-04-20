/**
 * GET /api/me/access — returns the caller's current tier.
 *
 * Used by client components (e.g. <WorldScopeChat>) to decide whether
 * to render the full feature or a paywall upsell. Auth-only; anonymous
 * visitors get FREE_CONTEXT.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resolveAccess, FREE_CONTEXT } from "@/lib/subscriptions/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(FREE_CONTEXT);
  }
  const access = await resolveAccess(userId);
  return NextResponse.json(access);
}
