"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client — reads session from cookies set by the
 * middleware. Singleton per tab so React strict mode double-renders don't
 * create duplicate realtime subscriptions.
 *
 * Use this in client components (e.g. sign-in forms, useUser-style hooks,
 * anything that needs `onAuthStateChange`).
 */
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return _client;
}
