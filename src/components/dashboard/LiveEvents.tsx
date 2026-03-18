"use client";

import { useMemo } from "react";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelItem } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";
import { truncate } from "@/lib/utils/sanitize";
import { ScrollArea } from "@/components/ui/scroll-area";

/** Real-time event stream — chronological, all severities */
export function LiveEvents() {
  const { items } = useIntelFeed();

  // Most recent events sorted by time
  const recentItems = useMemo(() => {
    return [...items]
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      .slice(0, 50);
  }, [items]);

  return (
    <div className="h-full flex flex-col bg-hud-surface/50 border border-hud-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-hud-border flex items-center justify-between">
        <span className="hud-label text-[9px] flex items-center gap-1.5">
          <span className="text-severity-low animate-blink">●</span>
          LIVE EVENT STREAM
        </span>
        <span className="font-mono text-[8px] text-hud-muted">
          {items.length} events
        </span>
      </div>

      {/* Event stream */}
      <ScrollArea className="flex-1">
        <div className="p-1.5 flex flex-col gap-0.5">
          {recentItems.map((item) => (
            <EventRow key={item.id} item={item} />
          ))}
          {recentItems.length === 0 && (
            <div className="py-6 text-center">
              <span className="font-mono text-[10px] text-hud-muted animate-blink">
                ◆ AWAITING DATA STREAM...
              </span>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function EventRow({ item }: { item: IntelItem }) {
  const color = SEVERITY_COLORS[item.severity];
  const icon = CATEGORY_ICONS[item.category] || "📄";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 px-2 py-1.5 rounded border-l-2 hover:bg-hud-panel/60 transition-all group"
      style={{ borderColor: `${color}60` }}
    >
      {/* Time column */}
      <span className="font-mono text-[8px] text-hud-muted w-10 shrink-0 pt-0.5 text-right">
        {timeAgo(item.publishedAt)}
      </span>

      {/* Severity dot */}
      <div className="pt-1.5 shrink-0">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-hud-text leading-snug group-hover:text-white transition-colors">
          {truncate(item.title, 100)}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[8px]">{icon}</span>
          <span className="font-mono text-[7px] text-hud-muted uppercase">
            {item.category}
          </span>
          <span className="font-mono text-[7px] text-hud-muted">
            {item.source}
          </span>
          {item.lat != null && (
            <span className="font-mono text-[7px] text-hud-accent">📍</span>
          )}
        </div>
      </div>
    </a>
  );
}
