"use client";

import { useMemo, useState, useCallback } from "react";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { SEVERITY_COLORS } from "@/types/intel";
import type { IntelItem } from "@/types/intel";
import { NewsPreviewModal } from "./NewsPreviewModal";

/**
 * Live news ticker — horizontal scrolling bar showing latest headlines.
 * Displayed above StatusFooter on desktop, hidden on mobile.
 */
export function NewsTicker() {
  const { items } = useIntelFeed();
  const [previewItem, setPreviewItem] = useState<IntelItem | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Take latest 30 items sorted by time
  const headlines = useMemo(
    () =>
      [...items]
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 30),
    [items]
  );

  const handleClick = useCallback((item: IntelItem) => {
    setPreviewItem(item);
  }, []);

  if (headlines.length === 0) return null;

  return (
    <>
      <div
        className="h-6 bg-hud-base/90 border-t border-hud-border overflow-hidden relative shrink-0"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Gradient edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-hud-base to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-hud-base to-transparent z-10" />

        {/* BREAKING label */}
        <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center px-2 bg-hud-base">
          <span className="font-mono text-[7px] font-bold tracking-wider text-severity-critical animate-pulse">
            LIVE ●
          </span>
        </div>

        {/* Scrolling content */}
        <div
          className="flex items-center h-full pl-14 whitespace-nowrap"
          style={{
            animation: isPaused ? "none" : `tickerScroll ${Math.max(30, headlines.length * 4)}s linear infinite`,
          }}
        >
          {/* Duplicate content for seamless loop */}
          {[...headlines, ...headlines].map((item, i) => (
            <button
              key={`${item.id}-${i}`}
              onClick={() => handleClick(item)}
              className="inline-flex items-center gap-1.5 mx-4 hover:brightness-125 transition-all cursor-pointer"
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: SEVERITY_COLORS[item.severity] }}
              />
              <span className="font-mono text-[8px] text-hud-text hover:text-white transition-colors">
                {item.title.length > 80 ? item.title.slice(0, 80) + "..." : item.title}
              </span>
              <span className="font-mono text-[6px] text-hud-muted">
                {item.source}
              </span>
              <span className="text-hud-border mx-2">│</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview modal */}
      <NewsPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </>
  );
}
