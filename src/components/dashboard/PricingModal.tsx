"use client";

import { useState } from "react";
import { FREE_TIER, PRO_TIER, isPaddleConfigured } from "@/lib/payments/paddle";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Pricing modal — Free vs Pro tier comparison.
 * Integrates with Paddle checkout when configured.
 */
export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const paddleReady = isPaddleConfigured();

  if (!isOpen) return null;

  const monthlyPrice = 9;
  const yearlyPrice = 79;
  const price = billingCycle === "monthly" ? monthlyPrice : yearlyPrice;
  const period = billingCycle === "monthly" ? "/mo" : "/yr";
  const savings = billingCycle === "yearly" ? Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-hud-panel border border-hud-border rounded-xl max-w-3xl w-full mx-4 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-mono text-lg text-hud-accent tracking-wider mb-1">UPGRADE TO PRO</h2>
          <p className="font-mono text-[10px] text-hud-muted">Unlock the full intelligence platform</p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`font-mono text-[9px] px-3 py-1 rounded transition-all ${billingCycle === "monthly" ? "bg-hud-accent/20 text-hud-accent border border-hud-accent/50" : "text-hud-muted"}`}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`font-mono text-[9px] px-3 py-1 rounded transition-all ${billingCycle === "yearly" ? "bg-hud-accent/20 text-hud-accent border border-hud-accent/50" : "text-hud-muted"}`}
            >
              YEARLY {savings > 0 && <span className="text-green-400 ml-1">-{savings}%</span>}
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Free tier */}
          <div className="border border-hud-border/50 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="font-mono text-sm text-hud-text tracking-wider">{FREE_TIER.name}</h3>
              <div className="font-mono text-2xl text-hud-muted mt-1">$0</div>
              <p className="font-mono text-[8px] text-hud-muted mt-1">Always free, no signup</p>
            </div>
            <ul className="space-y-2">
              {FREE_TIER.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-hud-muted text-[10px] mt-0.5">○</span>
                  <span className="font-mono text-[9px] text-hud-muted">{f}</span>
                </li>
              ))}
            </ul>
            <button className="w-full mt-4 py-2 border border-hud-border rounded font-mono text-[9px] text-hud-muted cursor-default">
              CURRENT PLAN
            </button>
          </div>

          {/* Pro tier */}
          <div className="border-2 border-hud-accent/50 rounded-lg p-4 relative">
            <div className="absolute -top-2.5 left-4 bg-hud-accent text-hud-base font-mono text-[7px] font-bold px-2 py-0.5 rounded tracking-wider">
              RECOMMENDED
            </div>
            <div className="mb-4">
              <h3 className="font-mono text-sm text-hud-accent tracking-wider">{PRO_TIER.name}</h3>
              <div className="font-mono text-2xl text-hud-text mt-1">
                ${price}<span className="text-sm text-hud-muted">{period}</span>
              </div>
              <p className="font-mono text-[8px] text-hud-muted mt-1">Full access to all features</p>
            </div>
            <ul className="space-y-2">
              {PRO_TIER.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-hud-accent text-[10px] mt-0.5">●</span>
                  <span className="font-mono text-[9px] text-hud-text">{f}</span>
                </li>
              ))}
            </ul>
            <button
              className={`w-full mt-4 py-2 rounded font-mono text-[9px] font-bold tracking-wider transition-all ${
                paddleReady
                  ? "bg-hud-accent text-hud-base hover:bg-hud-accent/80"
                  : "bg-hud-accent/30 text-hud-accent cursor-not-allowed"
              }`}
              disabled={!paddleReady}
              onClick={() => {
                if (paddleReady) {
                  // TODO: Paddle checkout integration
                  window.alert("Paddle checkout coming soon!");
                }
              }}
            >
              {paddleReady ? "UPGRADE NOW" : "COMING SOON"}
            </button>
          </div>
        </div>

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-hud-muted hover:text-hud-text text-lg">✕</button>
      </div>
    </div>
  );
}
