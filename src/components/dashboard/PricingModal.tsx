"use client";

import { useState } from "react";
import { SITE_FREE, MAIL_PREMIUM, isPaddleConfigured } from "@/lib/payments/paddle";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Pricing modal — Site is FREE, $1/mo mail subscription available.
 * Shows the value proposition: free site + premium mail service.
 */
export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const paddleReady = isPaddleConfigured();

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) return;
    setStatus("loading");

    try {
      if (paddleReady) {
        // Open Paddle checkout
        const { initializePaddle } = await import("@paddle/paddle-js");
        const paddle = await initializePaddle({
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
          environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
        });
        paddle?.Checkout.open({
          items: [{ priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID!, quantity: 1 }],
          customer: { email },
          customData: { source: "pricing_modal" },
          settings: {
            successUrl: `${window.location.origin}?subscribed=true`,
            displayMode: "overlay",
            theme: "dark",
          },
        });
        setStatus("idle");
      } else {
        // Fallback: free subscription (no payment)
        const res = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, frequency: "daily", tier: "free" }),
        });
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-hud-panel border border-hud-border rounded-xl max-w-3xl w-full mx-4 p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-hud-muted hover:text-hud-text text-lg">✕</button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-mono text-lg text-hud-accent tracking-wider mb-1">◆ WORLDSCOPE</h2>
          <p className="font-mono text-[10px] text-hud-muted">Free intelligence platform + premium mail service</p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Free site */}
          <div className="border border-hud-border/50 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="font-mono text-sm text-hud-text tracking-wider">{SITE_FREE.name}</h3>
              <div className="font-mono text-2xl text-hud-text mt-1">FREE</div>
              <p className="font-mono text-[8px] text-hud-muted mt-1">{SITE_FREE.tagline}</p>
            </div>
            <ul className="space-y-2">
              {SITE_FREE.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-green-400 text-[10px] mt-0.5">✓</span>
                  <span className="font-mono text-[9px] text-hud-text">{f}</span>
                </li>
              ))}
            </ul>
            <div className="w-full mt-4 py-2 border border-green-500/30 bg-green-500/10 rounded font-mono text-[9px] text-green-400 text-center">
              ✓ YOU HAVE FULL ACCESS
            </div>
          </div>

          {/* Premium mail */}
          <div className="border-2 border-hud-accent/50 rounded-lg p-4 relative">
            <div className="absolute -top-2.5 left-4 bg-hud-accent text-hud-base font-mono text-[7px] font-bold px-2 py-0.5 rounded tracking-wider">
              PREMIUM MAIL
            </div>
            <div className="mb-4">
              <h3 className="font-mono text-sm text-hud-accent tracking-wider">{MAIL_PREMIUM.name}</h3>
              <div className="font-mono text-2xl text-hud-text mt-1">
                ${MAIL_PREMIUM.price}<span className="text-sm text-hud-muted">/{MAIL_PREMIUM.period}</span>
              </div>
              <p className="font-mono text-[8px] text-hud-muted mt-1">{MAIL_PREMIUM.tagline}</p>
            </div>
            <ul className="space-y-2">
              {MAIL_PREMIUM.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-hud-accent text-[10px] mt-0.5">●</span>
                  <span className="font-mono text-[9px] text-hud-text">{f}</span>
                </li>
              ))}
            </ul>

            {/* Subscribe form */}
            <div className="mt-4 space-y-2">
              {status === "success" ? (
                <div className="py-2 bg-green-500/20 border border-green-500/50 rounded text-center">
                  <p className="font-mono text-[9px] text-green-400 font-bold">✓ SUBSCRIBED!</p>
                  <p className="font-mono text-[7px] text-hud-muted mt-1">Check your inbox for confirmation</p>
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 bg-hud-surface border border-hud-border rounded font-mono text-[10px] text-hud-text placeholder:text-hud-muted/50 focus:border-hud-accent focus:outline-none"
                  />
                  <button
                    onClick={handleSubscribe}
                    disabled={status === "loading" || !email}
                    className={`w-full py-2 rounded font-mono text-[9px] font-bold tracking-wider transition-all ${
                      status === "loading"
                        ? "bg-hud-accent/30 text-hud-accent cursor-wait"
                        : "bg-hud-accent text-hud-base hover:bg-hud-accent/80"
                    }`}
                  >
                    {status === "loading" ? "PROCESSING..." : paddleReady ? "SUBSCRIBE — $1/MO" : "GET FREE WEEKLY DIGEST"}
                  </button>
                  {status === "error" && (
                    <p className="font-mono text-[8px] text-red-400 text-center">Something went wrong. Try again.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
