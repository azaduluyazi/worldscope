import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cookie-aware Supabase client for Server Components + API routes + Route
 * Handlers. Reads the session cookie set by the middleware so `auth.getUser()`
 * returns the current user without any Clerk round-trip.
 *
 * Usage:
 *   const supabase = await createServerSupabase();
 *   const { data: { user } } = await supabase.auth.getUser();
 *
 * Note: in Next 15+/16 `cookies()` is async so this helper is async too.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — setAll is a no-op here; the
            // middleware is the canonical writer of session cookies.
          }
        },
      },
    },
  );
}

/**
 * Shorthand: get the currently signed-in Supabase user or null. Use at the
 * top of API routes and Server Components instead of `auth()` from Clerk.
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
