"use client";

import { AdSenseUnit } from "./AdSenseUnit";
import { AD_PLACEMENTS } from "@/config/ads";

/**
 * Native ad card for IntelFeed — blends with intel cards but marked as AD.
 * Renders a compact AdSense unit styled to match feed items.
 */
export function NativeAdCard() {
  const placement = AD_PLACEMENTS.feed[0];
  if (!placement?.enabled) return null;

  return (
    <div className="group relative p-2 rounded border border-hud-border/30 bg-hud-surface/30 hover:bg-hud-surface/50 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[7px] text-hud-muted/60 tracking-widest uppercase">
          Sponsored
        </span>
      </div>
      <AdSenseUnit slot={placement.slot!} format="auto" className="min-h-[50px]" />
    </div>
  );
}
