"use client";

import { useState } from "react";

/**
 * GaiaCheckoutButton — One-click entry into the Gaia ($9/mo) checkout.
 *
 * Hits /api/checkout/create with the configured Gaia variant id,
 * then redirects to the Lemon Squeezy hosted checkout. The caller is
 * responsible for gating render on `isTierPurchasable("gaia", ...)`
 * so this button only shows when the variant env var is set — the
 * button itself assumes it is.
 *
 * `email` is optional pre-fill; Lemon will ask if omitted. Pass
 * `cycle="annual"` to drive the $90/yr variant instead.
 */

interface Props {
  variantId: string;
  email?: string;
  redirectPath?: string;
  label: string;
  cycle?: "monthly" | "annual";
  compact?: boolean;
}

export function GaiaCheckoutButton({
  variantId,
  email,
  redirectPath = "/briefing?welcome=1",
  label,
  compact = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://troiamedia.com";
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          email,
          redirectUrl: `${origin}${redirectPath}`,
        }),
      });
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
