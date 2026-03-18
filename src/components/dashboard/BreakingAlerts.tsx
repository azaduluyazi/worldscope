"use client";

import { useMemo, useState, useEffect } from "react";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelItem } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";
import { truncate } from "@/lib/utils/sanitize";
import { ScrollArea } from "@/components/ui/scroll-area";

/** Auto-rotating breaking news + critical alerts panel */
export function BreakingAlerts() {
  const { items } = useIntelFeed();
  const [highlightIdx, setHighlightIdx] = useState(0);

  // Filter critical and high severity items
  const alerts = useMemo(() => {
    return items
      .filter((i) => i.severity === "critical" || i.severity === "high")
      .slice(0, 20);
  }, [items]);

  // Auto-rotate featured alert every 5s
  useEffect(() => {
    if (alerts.length <= 1) return;
    const timer = setInterval(() => {
      setHighlightIdx((prev) => (prev + 1) % Math.min(alerts.length, 5));
    }, 5000);
    return () => clearInterval(timer);
  }, [alerts.length]);

  const featured = alerts[highlightIdx];

  return (
    <div className="h-full flex flex-col bg-hud-surface/50 border border-hud-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-hud-border flex items-center justify-between">
        <span className="hud-label text-[9px] flex items-center gap-1.5">
          <span className="text-severity-critical animate-blink">◆</span>
          BREAKING ALERTS
        </span>
        <span className="font-mono text-[8px] text-hud-muted">
          {alerts.length} active
        </span>
      </div>

      {/* Featured Alert — large display */}
      {featured ? (
        <a
          href={featured.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-3 border-b border-hud-border hover:bg-hud-panel/50 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="font-mono text-[10px] font-bold tracking-wider animate-blink"
              style={{ color: SEVERITY_COLORS[featured.severity] }}
            >
              {CATEGORY_ICONS[featured.category]} {featured.severity.toUpperCase()}
            </span>
            <span className="font-mono text-[8px] text-hud-muted">
              {timeAgo(featured.publishedAt)}
            </span>
          </div>
          <p className="text-[13px] text-hud-text leading-snug font-medium">
            {truncate(featured.title, 140)}
          </p>
          {featured.summary && (
            <p className="text-[10px] text-hud-muted leading-relaxed mt-1">
              {truncate(featured.summary, 120)}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="font-mono text-[7px] text-hud-muted">{featured.source}</span>
            {featured.lat != null && (
              <span className="font-mono text-[7px] text-hud-accent">📍 GEO</span>
            )}
          </div>
          {/* Rotation dots */}
          {alerts.length > 1 && (
            <div className="flex gap-1 mt-2">
              {alerts.slice(0, 5).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{
                    backgroundColor: i === highlightIdx ? "#ff4757" : "#1a2a3a",
                  }}
                />
              ))}
            </div>
          )}
        </a>
      ) : (
        <div className="px-3 py-6 text-center">
          <span className="font-mono text-[10px] text-severity-low">
            ✓ NO CRITICAL ALERTS
          </span>
        </div>
      )}

      {/* Alert list */}
      <ScrollArea className="flex-1">
        <div className="p-1.5 flex flex-col gap-0.5">
          {alerts.slice(0, 15).map((alert, idx) => (
            <AlertRow key={alert.id} item={alert} isHighlighted={idx === highlightIdx} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function AlertRow({ item, isHighlighted }: { item: IntelItem; isHighlighted: boolean }) {
  const color = SEVERITY_COLORS[item.severity];
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-start gap-2 px-2 py-1.5 rounded transition-all hover:bg-hud-panel/60 ${
        isHighlighted ? "bg-hud-panel/40 border-l-2" : "border-l-2 border-transparent"
      }`}
      style={isHighlighted ? { borderColor: color } : undefined}
    >
      <span className="text-[9px] mt-0.5">{CATEGORY_ICONS[item.category]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-hud-text leading-snug truncate">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-mono text-[7px]" style={{ color }}>
            {item.severity.toUpperCase()}
          </span>
          <span className="font-mono text-[7px] text-hud-muted">
            {timeAgo(item.publishedAt)}
          </span>
        </div>
      </div>
    </a>
  );
}
