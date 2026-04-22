import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase.generated";

/**
 * Canonical Supabase client type for this app — always parameterized
 * with the generated `Database` schema so column names and row shapes
 * are checked at compile time. Historically there was an "untyped"
 * variant alongside; it was removed after every caller migrated.
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Lazy singleton — avoids "supabaseKey is required" during build when
// env vars are empty (e.g. static page generation in CI).
let _supabase: TypedSupabaseClient | null = null;

export function getSupabase(): TypedSupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }
    _supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

/** @deprecated Use getSupabase() for build-safe lazy init */
export const supabase =
  supabaseUrl && supabaseKey
    ? createClient<Database>(supabaseUrl, supabaseKey)
    : (null as unknown as TypedSupabaseClient);

export function createServerClient(): TypedSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env vars for server client");
  }
  return createClient<Database>(url, key);
}
