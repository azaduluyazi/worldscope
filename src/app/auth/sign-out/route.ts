import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/db/supabase-server";

/**
 * POST /auth/sign-out
 *
 * Clears the Supabase session cookie and redirects home. Called by the
 * TopBar user menu and the /account page. GET is also accepted for
 * plain-link fallback when JS is unavailable.
 */
async function handle(request: NextRequest) {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}

export const POST = handle;
export const GET = handle;
