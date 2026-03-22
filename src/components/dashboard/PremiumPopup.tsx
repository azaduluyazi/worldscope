"use client";

import { useState, useEffect } from "react";

/**
 * Premium subscription popup — small, non-intrusive.
 * Appears in bottom-right corner after 30 seconds.
 * Shows once per session, remembers dismissal.
 */
export function PremiumPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem("premium-dismissed")) return;

    const timer = setTimeout(() => setIsVisible(true), 30000); // 30s delay
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("premium-dismissed", "1");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[150] w-72 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-hud-panel/95 backdrop-blur-md border border-hud-accent/30 rounded-lg shadow-2xl shadow-black/50 p-4">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 text-hud-muted hover:text-hud-text text-xs"
        >
          ✕
        </button>

          <>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚡</span>
              <div>
                <p className="font-mono text-[10px] text-hud-accent font-bold tracking-wider">PREMIUM INTEL</p>
                <p className="font-mono text-[8px] text-hud-muted">Daily briefing + breaking alerts</p>
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
                "Weekly trend analysis",
              ].map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <span className="text-hud-accent text-[8px]">●</span>
                  <span className="font-mono text-[8px] text-hud-muted">{f}</span>
                </li>
              ))}
            </ul>

            {/* Coming Soon Notice */}
            <div className="bg-hud-accent/10 border border-hud-accent/30 rounded px-3 py-2 text-center">
              <p className="font-mono text-[9px] text-hud-accent font-bold tracking-wider">COMING VERY SOON</p>
              <p className="font-mono text-[7px] text-hud-muted mt-1">Premium intel subscription launching soon. Stay tuned!</p>
            </div>
          </>
      </div>
    </div>
  );
}
