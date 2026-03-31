"use client";

import { useEffect } from "react";
import { useTrending } from "@/hooks/useTrending";
import type { Severity } from "@/types/intel";

const SEVERITY_DOT_COLORS: Record<Severity, string> = {
  critical: "#ff4757",
  high: "#ffd000",
  medium: "#00e5ff",
  low: "#00ff88",
  info: "#8a5cf6",
};

/** Threshold in ms — items ranked 1st or 2nd by severity get the pulse CSS class */
const FRESH_THRESHOLD = 2;

/**
 * "TRENDING NOW" widget — top 5 trending events with live viewer count.
 * Compact dark HUD style. Pulse animation on top-severity items.
 */
export function TrendingNow() {
  const { trendingItems, viewerCount, isLoading } = useTrending();

  // Heartbeat: register viewer on mount and every 4 min
  useEffect(() => {
    const ping = () => {
      fetch("/api/realtime/viewers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: "dashboard" }),
      }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 240_000);
    return () => clearInterval(interval);
  }, []);

  const top5 = trendingItems.slice(0, 5);

  return (
    <div className="bg-hud-surface/70 border border-hud-border/50 rounded p-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[9px] text-hud-accent uppercase tracking-widest">
          Trending Now
        </span>
        <span
          className="font-mono text-[8px] text-hud-muted flex items-center gap-1"
          title="Active viewers"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
          {viewerCount} watching
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-3">
          <span className="font-mono text-[8px] text-hud-muted animate-pulse">
            SCANNING...
          </span>
        </div>
      ) : top5.length === 0 ? (
        <span className="font-mono text-[8px] text-hud-muted">
          NO TRENDING DATA
        </span>
      ) : (
        <div className="flex flex-col gap-0.5">
          {top5.map((item, i) => {
            // Pulse the top items (critical/high severity) as visual emphasis
            const isNew = i < FRESH_THRESHOLD && (item.severity === "critical" || item.severity === "high");
            const dotColor =
              SEVERITY_DOT_COLORS[item.severity as Severity] || "#8a5cf6";

            return (
              <div
                key={item.id}
                className={`flex items-center gap-1.5 px-1 py-0.5 rounded transition-all ${
                  isNew ? "animate-pulse bg-hud-accent/5" : ""
                } hover:bg-hud-surface/50`}
              >
                {/* Rank */}
                <span className="font-mono text-[8px] text-hud-muted w-3 shrink-0 text-right">
                  {i + 1}
                </span>

                {/* Severity dot */}
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor }}
                />

                {/* Title */}
                <span className="font-mono text-[8px] text-hud-text truncate flex-1">
                  {item.title}
                </span>

                {/* Trending indicator */}
                <span
                  className="font-mono text-[9px] shrink-0"
                  style={{ color: dotColor }}
                >
                  {"\u2191"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
