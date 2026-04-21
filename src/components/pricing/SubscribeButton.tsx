"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import type { TierSlug } from "@/lib/subscriptions/tier-config";

interface SubscribeButtonProps {
  slug: TierSlug;
  /** True when the tier's Lemon variant id is configured. When false,
   *  we render "Coming Soon" instead of a clickable button. */
  purchasable: boolean;
  /** Accent class — tier cards pick amber / purple etc. */
  className?: string;
  /** Text shown in the default state. */
  label?: string;
}

/**
 * Button that kicks off the Lemon Squeezy checkout for a given tier.
 *
 * Flow:
 *   1. Click → POST /api/checkout/tier { slug }
 *   2. 401 with redirect hint → push user to /sign-up (come back here)
 *   3. 409 (existing subscription) → surface the reason + portalHint
 *   4. 200 { url } → window.location = url (Lemon checkout)
 *
 * The server route does the variant-id lookup and attaches the Clerk
 * user id into custom_data so the webhook can bind the subscription.
 */
export function SubscribeButton({
  slug,
  purchasable,
  className = "",
  label = "SUBSCRIBE",
}: SubscribeButtonProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!purchasable) {
    return (
      <div className={`inline-block px-3 py-2 text-xs font-bold tracking-wider border border-amber-400/30 text-amber-300/60 ${className}`}>
        COMING SOON
      </div>
    );
  }

  const disabled = !isLoaded || pending;

  async function onClick() {
    setError(null);

    // Shortcut: if we already know the visitor is signed out, send them
    // straight to /sign-up with a redirect back to /pricing so they can
    // click again after auth.
    if (isLoaded && !isSignedIn) {
      router.push(`/sign-up?redirect_url=/pricing%23${slug}`);
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/checkout/tier", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const body: {
        url?: string;
        redirect?: string;
        error?: string;
        reason?: string;
        portalHint?: string;
      } = await res.json().catch(() => ({}));

      if (res.status === 401 && body.redirect) {
        router.push(body.redirect);
        return;
      }
      if (res.status === 409) {
        const msg = body.reason ?? body.error ?? "Existing subscription.";
        setError(msg);
        if (body.portalHint) {
          // Brief pause so the user sees the message before redirect.
          setTimeout(() => router.push(body.portalHint!), 1500);
        }
        return;
      }
      if (!res.ok || !body.url) {
        setError(body.error ?? `Checkout failed (${res.status}).`);
        return;
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full px-3 py-2 text-xs font-bold tracking-wider bg-amber-400 text-[#060509] hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? "…" : label}
      </button>
      {error && (
        <p className="text-[10px] text-red-400 mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
