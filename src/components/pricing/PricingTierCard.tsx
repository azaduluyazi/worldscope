"use client";

import { useState } from "react";
import { SubscribeButton } from "./SubscribeButton";
import type { BillingCycle, TierSlug } from "@/lib/subscriptions/tier-config";

interface TierDescriptor {
  slug: TierSlug;
  cycle: BillingCycle;
  purchasable: boolean;
  price: string;
  unit: string;
  savings?: string;
}

interface PricingTierCardProps {
  slug: TierSlug;
  name: string;
  greek: string;
  tag: string;
  lede: string;
  bullets: string[];
  /** Pre-computed server-side so the UI already knows which cycles are
   *  purchasable (variant ids in env); client just toggles between them. */
  monthly: TierDescriptor;
  annual: TierDescriptor | null;
}

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-amber-400 mt-0.5">◆</span>
      <span className="text-gray-200">{text}</span>
    </li>
  );
}

/**
 * Single-tier pricing card with monthly/annual toggle. The `monthly` and
 * `annual` descriptors are resolved server-side (reads env vars) so the
 * card knows at render time which cycles are purchasable. If `annual`
 * is null, we hide the toggle and the card renders as monthly-only.
 */
export function PricingTierCard({
  slug,
  name,
  greek,
  tag,
  lede,
  bullets,
  monthly,
  annual,
}: PricingTierCardProps) {
  const [cycle, setCycle] = useState<BillingCycle>(
    annual?.purchasable ? "annual" : "monthly",
  );

  const active = cycle === "annual" && annual ? annual : monthly;
  const effectiveTag = active.purchasable ? "Available" : tag;

  return (
    <div
      id={slug}
      className="border border-amber-400/40 rounded-sm p-5 bg-amber-400/[0.03] scroll-mt-24 flex flex-col"
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[10px] font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-sm tracking-wider uppercase">
          {effectiveTag}
        </span>
        <h3 className="text-base font-bold text-amber-300 tracking-wide uppercase">
          {name} <span className="text-amber-200/60 font-normal">· {greek}</span>
        </h3>
      </div>

      {/* Cycle toggle — only rendered when annual variant is configured */}
      {annual && (
        <div className="inline-flex self-start rounded-sm border border-amber-400/30 overflow-hidden mb-4 text-[10px] font-mono tracking-wider">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            className={`px-3 py-1.5 transition-colors ${
              cycle === "monthly"
                ? "bg-amber-400 text-[#060509]"
                : "bg-transparent text-amber-300 hover:bg-amber-400/10"
            }`}
          >
            MONTHLY
          </button>
          <button
            type="button"
            onClick={() => setCycle("annual")}
            className={`px-3 py-1.5 transition-colors flex items-center gap-1 ${
              cycle === "annual"
                ? "bg-amber-400 text-[#060509]"
                : "bg-transparent text-amber-300 hover:bg-amber-400/10"
            }`}
          >
            ANNUAL
            {annual.savings && (
              <span
                className={`text-[9px] px-1 py-0.5 rounded-sm ${
                  cycle === "annual"
                    ? "bg-[#060509]/20 text-[#060509]"
                    : "bg-amber-400/20 text-amber-300"
                }`}
              >
                {annual.savings}
              </span>
            )}
          </button>
        </div>
      )}

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-amber-300">{active.price}</span>
        <span className="text-xs text-gray-500">{active.unit}</span>
      </div>
      <p className="text-sm text-gray-300 mb-3">{lede}</p>
      <ul className="space-y-2 text-sm text-gray-200 mb-4 flex-1">
        {bullets.map((b) => (
          <Feature key={b} text={b} />
        ))}
      </ul>
      <SubscribeButton
        slug={slug}
        cycle={active.cycle}
        purchasable={active.purchasable}
        label={`SUBSCRIBE · ${name.toUpperCase()}`}
        className="mt-auto"
      />
    </div>
  );
}
