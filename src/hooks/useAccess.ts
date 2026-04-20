"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { FREE_CONTEXT, type AccessContext } from "@/lib/subscriptions/access";

/**
 * Fetches the signed-in user's tier + subscription from /api/me/access
 * once on mount, plus when Clerk auth state flips. Returns FREE_CONTEXT
 * for signed-out visitors so consumers can always read .tier without
 * null-checking.
 */
export function useAccess(): { access: AccessContext; loading: boolean } {
  const { isSignedIn, isLoaded } = useAuth();
  const [access, setAccess] = useState<AccessContext>(FREE_CONTEXT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    if (!isSignedIn) {
      // Flip to free-context asynchronously so the effect doesn't issue
      // a synchronous setState (react-hooks/set-state-in-effect).
      queueMicrotask(() => {
        if (cancelled) return;
        setAccess(FREE_CONTEXT);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }
    fetch("/api/me/access", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : FREE_CONTEXT))
      .then((data: AccessContext) => {
        if (!cancelled) {
          setAccess(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAccess(FREE_CONTEXT);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  return { access, loading };
}
