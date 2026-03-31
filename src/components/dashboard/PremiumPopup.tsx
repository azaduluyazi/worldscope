"use client";

import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Free newsletter signup popup — sleek dark HUD aesthetic.
 * Appears in bottom-right corner after 30 seconds.
 * Shows once per session, remembers dismissal via sessionStorage.
 * Component name kept as PremiumPopup to avoid breaking DashboardShell import.
 */
export function PremiumPopup() {
  const { isSubscribed, subscribe } = useSubscription();
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (isSubscribed) return;
    if (sessionStorage.getItem("premium-dismissed")) return;
    const timer = setTimeout(() => setIsVisible(true), 30000);
    return () => clearTimeout(timer);
  }, [isSubscribed]);

  const dismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("premium-dismissed", "1");
  };

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) return;
    setStatus("loading");
    try {
      const ok = await subscribe(email);
      setStatus(ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[150] w-80 animate-in slide-in-from-right-4 duration-500">
      <div
        style={{
          background: "#0a1628",
          border: "1px solid #1a2332",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 229, 255, 0.08)",
        }}
        className="relative rounded-lg p-5"
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 transition-colors"
          style={{ color: "#4a5568" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e2e8f0")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#4a5568")}
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {status === "success" ? (
          /* ---------- Success state ---------- */
          <div className="text-center py-3">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ background: "rgba(0, 255, 136, 0.1)", border: "1px solid rgba(0, 255, 136, 0.3)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 13L9 17L19 7" stroke="#00ff88" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-mono text-xs font-bold tracking-wider" style={{ color: "#00ff88" }}>
              SUBSCRIBED
            </p>
            <p className="font-mono text-[11px] mt-2" style={{ color: "#4a5568" }}>
              Check your inbox tomorrow for your first briefing.
            </p>
            <button
              onClick={dismiss}
              className="mt-4 font-mono text-[10px] tracking-wider transition-colors"
              style={{ color: "#4a5568" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e2e8f0")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#4a5568")}
            >
              CLOSE
            </button>
          </div>
        ) : (
          /* ---------- Signup form ---------- */
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0, 229, 255, 0.1)", border: "1px solid rgba(0, 229, 255, 0.2)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="#00e5ff" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="8" stroke="#00e5ff" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
                  <line x1="12" y1="1" x2="12" y2="5" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                  <line x1="12" y1="19" x2="12" y2="23" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                  <line x1="1" y1="12" x2="5" y2="12" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                  <line x1="19" y1="12" x2="23" y2="12" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                </svg>
              </div>
              <div>
                <p className="font-mono text-[11px] font-bold tracking-widest" style={{ color: "#00e5ff" }}>
                  DAILY INTEL BRIEFING
                </p>
                <p className="font-mono text-[10px] mt-0.5" style={{ color: "#4a5568" }}>
                  Free daily intelligence delivered to your inbox
                </p>
              </div>
            </div>

            {/* Feature bullets */}
            <ul className="space-y-2 mb-4">
              {[
                "All daily news categorized",
                "AI situation assessment",
                "One-click unsubscribe",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: "#00e5ff", boxShadow: "0 0 6px rgba(0, 229, 255, 0.4)" }}
                  />
                  <span className="font-mono text-[10px]" style={{ color: "#e2e8f0" }}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* Email input + subscribe button */}
            <div className="space-y-2.5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                className="w-full px-3 py-2 rounded font-mono text-[11px] focus:outline-none transition-colors"
                style={{
                  background: "rgba(26, 35, 50, 0.6)",
                  border: "1px solid #1a2332",
                  color: "#e2e8f0",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#00e5ff")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#1a2332")}
              />
              <button
                onClick={handleSubscribe}
                disabled={status === "loading" || !email}
                className="w-full py-2 rounded font-mono text-[10px] font-bold tracking-widest transition-all"
                style={{
                  background: status === "loading" ? "rgba(0, 229, 255, 0.15)" : "#00e5ff",
                  color: status === "loading" ? "#00e5ff" : "#0a1628",
                  cursor: status === "loading" || !email ? "not-allowed" : "pointer",
                  opacity: !email ? 0.5 : 1,
                }}
              >
                {status === "loading" ? "SUBSCRIBING..." : "SUBSCRIBE FREE"}
              </button>
              {status === "error" && (
                <p className="font-mono text-[10px] text-center" style={{ color: "#ff4757" }}>
                  Something went wrong. Please try again.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
