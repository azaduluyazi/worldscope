"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * NewsletterStickyBar — Persistent bottom bar prompting newsletter signup.
 *
 * Shows only when:
 * - User is NOT already subscribed (ws-newsletter-subscribed flag)
 * - User has NOT dismissed the bar in the last 14 days (ws-sticky-dismissed)
 * - User has viewed at least 2 pages (reduces bounce-first interruption)
 * - Not on /briefing itself (redundant)
 */

const SUBSCRIBED_KEY = "ws-newsletter-subscribed";
const DISMISSED_KEY = "ws-sticky-dismissed";
const PAGE_VIEWS_KEY = "ws-page-views";
const COOLDOWN_DAYS = 14;

export function NewsletterStickyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname.startsWith("/briefing")) return;
    if (localStorage.getItem(SUBSCRIBED_KEY)) return;

    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt) {
      const days = (Date.now() - parseInt(dismissedAt, 10)) / 86_400_000;
      if (days < COOLDOWN_DAYS) return;
    }

    const views = parseInt(localStorage.getItem(PAGE_VIEWS_KEY) || "0", 10);
    if (views < 2) return;

    const timer = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Newsletter signup prompt"
      className="fixed bottom-0 left-0 right-0 z-40 bg-hud-panel/95 backdrop-blur-sm border-t border-hud-accent/30 px-4 py-2.5 shadow-lg"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:block font-mono text-[10px] text-hud-accent uppercase tracking-wider whitespace-nowrap">
            ⚡ INTEL FEED
          </div>
          <p className="font-mono text-[10px] sm:text-[11px] text-hud-text truncate">
            <span className="hidden sm:inline">
              The Sunday Convergence Report — 689 sources, one PDF, every
              Sunday.{" "}
            </span>
            <span className="sm:hidden">Sunday Convergence Report — free.</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/briefing"
            className="font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 bg-hud-accent text-hud-base rounded hover:bg-hud-accent/80 transition-colors whitespace-nowrap"
          >
            Subscribe
          </Link>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(DISMISSED_KEY, String(Date.now()));
              setVisible(false);
            }}
            aria-label="Dismiss newsletter prompt"
            className="text-hud-muted hover:text-hud-text text-xs leading-none px-2"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
