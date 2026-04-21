import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/db/supabase-server";

/**
 * GET /auth/callback
 *
 * Supabase OAuth + magic-link landing page. Both Google OAuth and the
 * email one-time-link redirect here with a `code` query param; we swap
 * it for a session cookie and redirect onward. The trigger added in
 * migration 021 writes the public.user_profiles row in the same
 * transaction that auth.users receives the new row, so by the time
 * this handler returns the profile is ready.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/account?welcome=1";
  const errorDescription = url.searchParams.get("error_description");

  if (errorDescription) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("error", errorDescription);
    return NextResponse.redirect(signIn);
  }

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const signIn = new URL("/sign-in", request.url);
      signIn.searchParams.set("error", error.message);
      return NextResponse.redirect(signIn);
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
