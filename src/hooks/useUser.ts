"use client";

import { useEffect, useState } from "react";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/db/supabase-browser";

interface UseUserState {
  /** True while the initial session lookup is pending. Mirrors Clerk's
   *  `isLoaded` so components that used to guard on it keep working. */
  isLoaded: boolean;
  /** The currently signed-in Supabase user, or null when anonymous. */
  user: User | null;
  /** Convenience: the stable UUID we use everywhere downstream (API calls,
   *  query keys) in place of Clerk's string userId. */
  userId: string | null;
  /** True if `user` is non-null. */
  isSignedIn: boolean;
}

/**
 * Client hook mirroring Clerk's useAuth/useUser shape so the migration
 * diff stays small. Subscribes to Supabase's auth state so the UI reflects
 * sign-out / token-refresh in real time.
 */
export function useUser(): UseUserState {
  const [state, setState] = useState<UseUserState>({
    isLoaded: false,
    user: null,
    userId: null,
    isSignedIn: false,
  });

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let mounted = true;

    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (!mounted) return;
      setState({
        isLoaded: true,
        user: data.user,
        userId: data.user?.id ?? null,
        isSignedIn: !!data.user,
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;
        setState({
          isLoaded: true,
          user: session?.user ?? null,
          userId: session?.user?.id ?? null,
          isSignedIn: !!session?.user,
        });
      },
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
