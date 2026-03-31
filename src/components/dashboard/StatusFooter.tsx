"use client";

import { useIntelFeed } from "@/hooks/useIntelFeed";
import { useEffect, useState } from "react";

/* Updated: policy links for legal compliance */
export function StatusFooter() {
  const { total, lastUpdated, isLoading } = useIntelFeed();
  const [uptime, setUptime] = useState("0:00");

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      setUptime(`${m}:${String(s).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-5 bg-hud-surface/80 border-t border-hud-border flex items-center px-3 gap-4 font-mono text-[7px] text-hud-muted/60 z-50 shrink-0">
      <span>
        <span className="text-hud-accent/60">&#9670;</span> WORLDSCOPE v1.0
      </span>
      <span>
        EVENTS: <span className="text-hud-accent/80">{total}</span>
      </span>
      <span>
        SOURCES: <span className="text-hud-accent/80">570+</span>
      </span>
      <span>
        FEEDS: <span className="text-hud-accent/80">505</span>
      </span>
      <span>
        APIs: <span className="text-hud-accent/80">48</span>
      </span>
      <span className="ml-auto flex items-center gap-3">
        <a href="/terms" className="hover:text-hud-accent transition-colors">Terms</a>
        <a href="/privacy" className="hover:text-hud-accent transition-colors">Privacy</a>
        <a href="/refund" className="hover:text-hud-accent transition-colors">Refund</a>
        <a href="/contact" className="hover:text-hud-accent transition-colors">Contact</a>
        <span className="text-hud-border">|</span>
        <span>SESSION: {uptime}</span>
        <span>
          {isLoading ? (
            <span className="text-hud-accent animate-pulse">&#9679; SYNCING</span>
          ) : (
            <>&#9679; LIVE {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : ""}</>
          )}
        </span>
      </span>
    </div>
  );
}
