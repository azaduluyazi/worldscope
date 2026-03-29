"use client";

import { useState, useEffect } from "react";
import { isPaddleConfigured } from "@/lib/payments/paddle";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Premium mail subscription popup — small, non-intrusive.
 * Appears in bottom-right corner after 30 seconds.
 * Shows once per session, remembers dismissal.
 * Functional: email input + Paddle checkout or free subscribe.
 */
export function PremiumPopup() {
  const { isPremium, isWaitingForWebhook, waitForWebhook, restore } = useSubscription();
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [restoreEmail, setRestoreEmail] = useState("");
  const [showRestore, setShowRestore] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "waiting" | "success" | "error" | "timeout">("idle");

  useEffect(() => {
    // Don't show popup for premium users
    if (isPremium) return;
    if (sessionStorage.getItem("premium-dismissed")) return;
    const timer = setTimeout(() => setIsVisible(true), 30000);
    return () => clearTimeout(timer);
  }, [isPremium]);

  const dismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("premium-dismissed", "1");
  };

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) return;
    setStatus("loading");

    try {
      if (isPaddleConfigured()) {
        const { initializePaddle } = await import("@paddle/paddle-js");
        const paddle = await initializePaddle({
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
          environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
        });
        paddle?.Checkout.open({
          items: [{ priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID!, quantity: 1 }],
          customer: { email },
          customData: { source: "premium_popup" },
          settings: {
            successUrl: `${window.location.origin}?subscribed=true`,
            displayMode: "overlay",
            theme: "dark",
          },
        });
        // Wait for Paddle webhook to confirm subscription (polls every 5s, max 60s)
        setStatus("waiting");
        const confirmed = await waitForWebhook(email);
        setStatus(confirmed ? "success" : "timeout");
      } else {
        // Free subscription fallback
        const res = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, frequency: "weekly", tier: "free" }),
        });
        setStatus(res.ok ? "success" : "error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[150] w-72 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-hud-panel/95 backdrop-blur-md border border-hud-accent/30 rounded-lg shadow-2xl shadow-black/50 p-4">
        <button onClick={dismiss} className="absolute top-2 right-2 text-hud-muted hover:text-hud-text text-xs">✕</button>

        {status === "waiting" || isWaitingForWebhook ? (
          <div className="text-center py-4">
            <div className="w-8 h-8 border-2 border-hud-accent/30 border-t-hud-accent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-mono text-[10px] text-hud-accent font-bold">CONFIRMING PAYMENT...</p>
            <p className="font-mono text-[7px] text-hud-muted mt-2">Waiting for payment confirmation.</p>
            <p className="font-mono text-[7px] text-hud-muted">This may take up to 60 seconds.</p>
          </div>
        ) : status === "success" ? (
          <div className="text-center py-2">
            <span className="text-2xl">✓</span>
            <p className="font-mono text-[10px] text-green-400 font-bold mt-2">PREMIUM ACTIVATED!</p>
            <p className="font-mono text-[7px] text-hud-muted mt-1">Daily briefing active — check your inbox</p>
            <p className="font-mono text-[7px] text-hud-muted">Check your inbox for confirmation</p>
            <button onClick={dismiss} className="mt-3 font-mono text-[8px] text-hud-muted hover:text-hud-text">Close</button>
          </div>
        ) : status === "timeout" ? (
          <div className="text-center py-2">
            <span className="text-2xl">⏳</span>
            <p className="font-mono text-[10px] text-yellow-400 font-bold mt-2">PAYMENT PROCESSING</p>
            <p className="font-mono text-[7px] text-hud-muted mt-1">Payment received but activation is taking longer than usual.</p>
            <p className="font-mono text-[7px] text-hud-muted">Your premium will activate within a few minutes.</p>
            <p className="font-mono text-[7px] text-hud-muted mt-1">Try refreshing the page shortly.</p>
            <button onClick={dismiss} className="mt-3 font-mono text-[8px] text-hud-muted hover:text-hud-text">Close</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚡</span>
              <div>
                <p className="font-mono text-[10px] text-hud-accent font-bold tracking-wider">PREMIUM INTEL MAIL</p>
                <p className="font-mono text-[8px] text-hud-muted">AI-powered daily briefings</p>
              </div>
            </div>

            {/* Price */}
            <div className="bg-hud-surface/50 rounded px-3 py-2 mb-3 text-center">
              <span className="font-mono text-xl text-hud-text font-bold">$1</span>
              <span className="font-mono text-[9px] text-hud-muted">/month</span>
              <p className="font-mono text-[7px] text-hud-muted mt-1">AI-powered intelligence to your inbox</p>
            </div>

            {/* Features */}
            <ul className="space-y-1 mb-3">
              {[
                "Daily AI situation briefing",
                "Breaking critical alerts (instant)",
                "Weekly trend analysis report",
                "Weekly geopolitical analysis",
              ].map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <span className="text-hud-accent text-[8px]">●</span>
                  <span className="font-mono text-[8px] text-hud-muted">{f}</span>
                </li>
              ))}
            </ul>

            {/* Subscribe form */}
            {showRestore ? (
              <div className="space-y-2">
                <p className="font-mono text-[8px] text-hud-muted text-center">Enter subscription email</p>
                <input
                  type="email"
                  value={restoreEmail}
                  onChange={(e) => setRestoreEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-1.5 bg-hud-surface border border-hud-border rounded font-mono text-[9px] text-hud-text placeholder:text-hud-muted/50 focus:border-hud-accent focus:outline-none"
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && restoreEmail) {
                      setStatus("loading");
                      const ok = await restore(restoreEmail);
                      setStatus(ok ? "success" : "error");
                    }
                  }}
                />
                <button
                  onClick={async () => {
                    if (!restoreEmail) return;
                    setStatus("loading");
                    const ok = await restore(restoreEmail);
                    setStatus(ok ? "success" : "error");
                  }}
                  disabled={status === "loading" || !restoreEmail}
                  className={`w-full py-1.5 rounded font-mono text-[8px] font-bold tracking-wider transition-all ${
                    status === "loading"
                      ? "bg-hud-accent/30 text-hud-accent cursor-wait"
                      : "bg-hud-accent text-hud-base hover:bg-hud-accent/80"
                  }`}
                >
                  {status === "loading" ? "CHECKING..." : "RESTORE ACCESS"}
                </button>
                <button
                  onClick={() => setShowRestore(false)}
                  className="w-full font-mono text-[7px] text-hud-muted hover:text-hud-text"
                >
                  Back
                </button>
                {status === "error" && (
                  <p className="font-mono text-[7px] text-red-400 text-center">No active subscription found.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-1.5 bg-hud-surface border border-hud-border rounded font-mono text-[9px] text-hud-text placeholder:text-hud-muted/50 focus:border-hud-accent focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                />
                <button
                  onClick={handleSubscribe}
                  disabled={status === "loading" || !email}
                  className={`w-full py-1.5 rounded font-mono text-[8px] font-bold tracking-wider transition-all ${
                    status === "loading"
                      ? "bg-hud-accent/30 text-hud-accent cursor-wait"
                      : "bg-hud-accent text-hud-base hover:bg-hud-accent/80"
                  }`}
                >
                  {status === "loading" ? "PROCESSING..." : isPaddleConfigured() ? "SUBSCRIBE — $1/MO" : "GET FREE WEEKLY DIGEST"}
                </button>
                <button
                  onClick={() => setShowRestore(true)}
                  className="w-full font-mono text-[7px] text-hud-muted hover:text-hud-accent transition-colors"
                >
                  Already subscribed? Restore access
                </button>
                {status === "error" && (
                  <p className="font-mono text-[7px] text-red-400 text-center">Error. Try again.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
