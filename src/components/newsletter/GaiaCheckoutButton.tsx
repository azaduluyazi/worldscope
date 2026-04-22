"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * GaiaCheckoutButton — One-click entry into the Gaia ($9/mo) checkout.
 *
 * Routes through /api/checkout/tier so the auth-gate + server-side
 * variant resolution kick in. Three outcomes:
 *   401 → not signed in, redirect to /sign-up?redirect_to=/briefing.
 *         Without this, the post-payment subscriptions row would land
 *         with user_id=NULL, and send-weekly-briefings (which filters
 *         by active subscriptions.user_id) wouldn't deliver.
 *   404 → tier not purchasable (variant env unset server-side).
 *   200 → returned URL → window.location.href = Lemon hosted checkout.
 *
 * The caller is responsible for gating render on
 * `isTierPurchasable("gaia", ...)` so the button only shows when the
 * server-side env is configured.
 */

interface Props {
  label: string;
  cycle?: "monthly" | "annual";
  redirectTo?: string;
  compact?: boolean;
}

export function GaiaCheckoutButton({
  label,
  cycle = "monthly",
  redirectTo = "/briefing",
  compact = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout/tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "gaia", cycle }),
      });

      if (res.status === 401) {
        const body = (await res.json().catch(() => ({}))) as { redirect?: string };
        router.push(body.redirect ?? `/sign-up?redirect_to=${encodeURIComponent(redirectTo)}`);
        return;
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error || "Checkout failed — please retry");
        setLoading(false);
        return;
      }

      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        lang="en"
        className={`${
          compact ? "px-4 py-2 text-[11px]" : "px-6 py-3 text-xs"
        } bg-amber-400 text-[#060509] font-mono font-bold tracking-wider rounded hover:bg-amber-300 transition-colors disabled:opacity-60 whitespace-nowrap`}
      >
        {loading ? "OPENING CHECKOUT…" : label}
      </button>
      {error && (
        <div className="mt-2 font-mono text-[10px] text-red-400">{error}</div>
      )}
    </div>
  );
}
