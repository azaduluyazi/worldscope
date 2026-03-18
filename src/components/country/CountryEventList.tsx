"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelItem } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";

const PAGE_SIZE = 25;

interface CountryEventListProps {
  items: IntelItem[];
}

export function CountryEventList({ items }: CountryEventListProps) {
  const t = useTranslations("country");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length));
  }, [items.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Reset visible count is handled by limiting to items.length in useMemo
  const visible = useMemo(() => items.slice(0, Math.min(visibleCount, items.length)), [items, visibleCount]);

  if (items.length === 0) {
    return (
      <div className="bg-hud-surface border border-hud-border rounded-md p-8 text-center">
        <p className="font-mono text-[10px] text-hud-muted">
          {t("noEvents", { name: "" })}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
        ◆ {t("recentIntel")} — {t("eventCount", { count: items.length })}
      </div>

      <div className="space-y-1.5">
        {visible.map((event) => (
          <article
            key={event.id}
            className="bg-hud-surface border border-hud-border rounded-md p-3 hover:border-hud-muted transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <div className="text-base mt-0.5 shrink-0">
                {CATEGORY_ICONS[event.category] || "📌"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span
                    className="font-mono text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded border"
                    style={{
                      color: SEVERITY_COLORS[event.severity],
                      borderColor: `${SEVERITY_COLORS[event.severity]}40`,
                      backgroundColor: `${SEVERITY_COLORS[event.severity]}10`,
                    }}
                  >
                    {event.severity.toUpperCase()}
                  </span>
                  <span className="font-mono text-[7px] text-hud-muted uppercase">
                    {event.category}
                  </span>
                  <span className="font-mono text-[7px] text-hud-muted ml-auto shrink-0">
                    {timeAgo(event.publishedAt)}
                  </span>
                </div>

                <h3 className="text-[11px] text-hud-text leading-snug mb-0.5">
                  {event.url ? (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-hud-accent transition-colors"
                    >
                      {event.title}
                    </a>
                  ) : (
                    event.title
                  )}
                </h3>

                {event.summary && (
                  <p className="text-[10px] text-hud-muted leading-relaxed line-clamp-2">
                    {event.summary}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-1">
                  {event.source && (
                    <span className="font-mono text-[7px] text-hud-muted">
                      {event.source}
                    </span>
                  )}
                  {event.lat != null && event.lng != null && (
                    <span className="font-mono text-[6px] text-hud-accent/60">
                      📍 {event.lat.toFixed(2)}°, {event.lng.toFixed(2)}°
                    </span>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {visibleCount < items.length && (
        <div ref={sentinelRef} className="py-3 text-center">
          <span className="font-mono text-[8px] text-hud-muted animate-pulse">◆ LOADING...</span>
        </div>
      )}
    </div>
  );
}
