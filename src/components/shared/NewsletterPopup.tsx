"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * NewsletterPopup — Multi-trigger newsletter subscription widget.
 *
 * Triggers (first match wins):
 * 1. Exit intent (mouse leaves viewport top) — desktop only
 * 2. Scroll depth (60% page scroll) — mobile/desktop
 * 3. Page view count (3+ views with 5s delay) — original behavior
 *
 * Improvements:
 * - Frequency selector (daily/weekly)
 * - 7-day dismiss cooldown (not permanent)
 * - Stronger value proposition with stats
 * - Social proof line
 */

const DISMISS_KEY = "ws-newsletter-dismissed";
const DISMISS_COOLDOWN_DAYS = 7;
const SUBSCRIBED_KEY = "ws-newsletter-subscribed";
const PAGE_VIEWS_KEY = "ws-page-views";

function isDismissExpired(): boolean {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return true;
  const dismissedAt = parseInt(dismissed, 10);
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSince >= DISMISS_COOLDOWN_DAYS;
}

export function NewsletterPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const triggered = useRef(false);

  const trigger = useCallback(() => {
    if (triggered.current) return;
    triggered.current = true;
    setShow(true);
  }, []);

  useEffect(() => {
    // Already subscribed — never show
    if (localStorage.getItem(SUBSCRIBED_KEY)) return;
    // Dismissed within cooldown — skip
    if (!isDismissExpired()) return;

    // Track page views
    const views = parseInt(localStorage.getItem(PAGE_VIEWS_KEY) || "0", 10) + 1;
    localStorage.setItem(PAGE_VIEWS_KEY, String(views));

    // ── Trigger 1: Exit intent (desktop — mouse leaves viewport top) ──
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };
    document.addEventListener("mouseleave", handleMouseLeave);

    // ── Trigger 2: Scroll depth (60%) ──
    const handleScroll = () => {
      const scrollPct =
        window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPct > 0.6) trigger();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // ── Trigger 3: Page views (3+ with delay) ──
    let viewTimer: ReturnType<typeof setTimeout> | undefined;
    if (views >= 3) {
      viewTimer = setTimeout(trigger, 5000);
    }

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
      if (viewTimer) clearTimeout(viewTimer);
    };
  }, [trigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, frequency }),
      });
      if (res.ok) {
        setStatus("success");
        localStorage.setItem(SUBSCRIBED_KEY, "true");
        setTimeout(() => setShow(false), 3000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // Store timestamp — cooldown expires after 7 days
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[340px] bg-hud-panel border border-hud-accent/30 rounded-lg shadow-2xl p-5 animate-in slide-in-from-bottom-4">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-3 text-hud-muted hover:text-hud-text text-sm leading-none"
        aria-label="Dismiss"
      >
        ✕
      </button>

      {/* Header */}
      <div className="font-mono text-[10px] text-hud-accent tracking-wider uppercase mb-1">
        INTELLIGENCE BRIEFING
      </div>

      {/* Value proposition */}
      <p className="font-mono text-[11px] text-hud-text mb-2 leading-relaxed">
        AI-curated intelligence from <strong>570+ sources</strong> across{" "}
        <strong>195 countries</strong> — delivered to your inbox.
      </p>

      {/* What you get */}
      <ul className="font-mono text-[9px] text-hud-muted space-y-0.5 mb-3">
        <li>&#x25B8; Threat assessments &amp; conflict updates</li>
        <li>&#x25B8; Market impact analysis &amp; predictions</li>
        <li>&#x25B8; Cyber threat intelligence &amp; CVE alerts</li>
      </ul>

      {status === "success" ? (
        <div className="font-mono text-[11px] text-green-400 py-2">
          ✓ Subscribed! First briefing arrives {frequency === "daily" ? "tomorrow" : "next Monday"}.
        </div>
      ) : (
        <>
          {/* Frequency toggle */}
          <div className="flex gap-1 mb-2.5">
            {(["daily", "weekly"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={`flex-1 py-1 rounded font-mono text-[9px] uppercase tracking-wider border transition-colors ${
                  frequency === f
                    ? "bg-hud-accent/20 border-hud-accent/50 text-hud-accent"
                    : "bg-transparent border-hud-border text-hud-muted hover:border-hud-accent/30"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 bg-hud-base border border-hud-border rounded px-2.5 py-1.5 font-mono text-[10px] text-hud-text placeholder:text-hud-muted/50 focus:border-hud-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-3 py-1.5 bg-hud-accent/20 border border-hud-accent/50 rounded font-mono text-[9px] text-hud-accent hover:bg-hud-accent/30 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {status === "loading" ? "..." : "Subscribe"}
            </button>
          </form>
        </>
      )}

      {status === "error" && (
        <div className="font-mono text-[9px] text-red-400 mt-1.5">
          Subscription failed. Please try again.
        </div>
      )}

      {/* Social proof */}
      <div className="font-mono text-[8px] text-hud-muted/60 mt-2.5 text-center">
        Free forever — No spam — Unsubscribe anytime
      </div>
    </div>
  );
}
