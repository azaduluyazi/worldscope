"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BillingCycle, TierSlug } from "@/lib/subscriptions/tier-config";

interface SubscribeButtonProps {
  slug: TierSlug;
  /** True when the tier's Lemon variant id is configured. When false,
   *  we render "Coming Soon" instead of a clickable button. */
  purchasable: boolean;
  /** Which Lemon variant to check out against. Defaults to "monthly" so
   *  existing callers keep working; the pricing page passes this
   *  explicitly based on the annual/monthly toggle. */
  cycle?: BillingCycle;
  className?: string;
  label?: string;
}

/**
 * Tier Subscribe button.
 *
 * Design note — the server is the single source of truth: the button is
 * always clickable, and the POST to /api/checkout/tier returns either a
 * Lemon checkout URL, a sign-up redirect (401), or an existing-subscription
 * conflict (409). No client-side auth gate, no hydration race.
 */
export function SubscribeButton({
  slug,
  purchasable,
  cycle = "monthly",
  className = "",
  label = "SUBSCRIBE",
}: SubscribeButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!purchasable) {
    return (
      <div
        className={`inline-block px-3 py-2 text-xs font-bold tracking-wider border border-amber-400/30 text-amber-300/60 ${className}`}
      >
        COMING SOON
      </div>
    );
  }

  async function onClick() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/checkout/tier", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, cycle }),
      });
      const body: {
        url?: string;
        redirect?: string;
        error?: string;
        reason?: string;
        portalHint?: string;
      } = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.push(
          body.redirect ?? `/sign-up?redirect_url=/pricing%23${slug}`,
        );
        return;
      }
      if (res.status === 409) {
        const msg = body.reason ?? body.error ?? "Existing subscription.";
        setError(msg);
        if (body.portalHint) {
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
        disabled={pending}
        className="w-full px-3 py-2 text-xs font-bold tracking-wider bg-amber-400 text-[#060509] hover:bg-amber-300 disabled:opacity-60 disabled:cursor-wait transition-colors cursor-pointer"
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
