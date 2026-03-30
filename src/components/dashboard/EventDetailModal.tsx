"use client";

import { useCallback } from "react";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelItem, Category } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";
import { addBookmark, isBookmarked } from "@/lib/bookmarks";

interface EventDetailModalProps {
  event: IntelItem | null;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const handleBookmark = useCallback(() => {
    if (!event) return;
    addBookmark({
      id: event.id,
      title: event.title,
      url: event.url,
      category: event.category,
      severity: event.severity,
      source: event.source,
    });
  }, [event]);

  if (!event) return null;

  const color = SEVERITY_COLORS[event.severity];
  const bookmarked = isBookmarked(event.id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-hud-surface border rounded-lg p-5 w-[90%] max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl"
        style={{ borderColor: `${color}40` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{CATEGORY_ICONS[event.category as Category] || "📌"}</span>
          <span
            className="font-mono text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border"
            style={{ color, borderColor: `${color}40`, backgroundColor: `${color}10` }}
          >
            {event.severity.toUpperCase()}
          </span>
          <span className="font-mono text-[8px] text-hud-muted uppercase">{event.category}</span>
          <span className="font-mono text-[8px] text-hud-muted ml-auto">{timeAgo(event.publishedAt)}</span>
          <button onClick={onClose} className="text-hud-muted hover:text-hud-text text-lg ml-2">✕</button>
        </div>

        {/* Title */}
        <h2 className="text-sm text-hud-text font-bold leading-snug mb-2">{event.title}</h2>

        {/* Summary */}
        {event.summary && (
          <p className="text-[11px] text-hud-muted leading-relaxed mb-3">{event.summary}</p>
        )}

        {/* Meta */}
        <div className="space-y-1 font-mono text-[8px] text-hud-muted border-t border-hud-border pt-3">
          <div>SOURCE: <span className="text-hud-text">{event.source}</span></div>
          <div>PUBLISHED: <span className="text-hud-text">{new Date(event.publishedAt).toLocaleString()}</span></div>
          {event.countryCode && <div>COUNTRY: <span className="text-hud-text">{event.countryCode}</span></div>}
          {event.lat != null && event.lng != null && (
            <div>COORDS: <span className="text-hud-accent">{event.lat.toFixed(4)}°, {event.lng.toFixed(4)}°</span></div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-hud-border">
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 font-mono text-[9px] px-3 py-1.5 rounded border border-hud-accent/40 bg-hud-accent/10 text-hud-accent text-center hover:bg-hud-accent/20 transition-colors"
            >
              OPEN SOURCE →
            </a>
          )}
          <button
            onClick={handleBookmark}
            disabled={bookmarked}
            className={`font-mono text-[9px] px-3 py-1.5 rounded border transition-colors ${
              bookmarked
                ? "border-severity-low/30 text-severity-low opacity-60"
                : "border-hud-border text-hud-muted hover:text-hud-accent hover:border-hud-accent/30"
            }`}
          >
            {bookmarked ? "✓ SAVED" : "🔖 SAVE"}
          </button>
        </div>
      </div>
    </div>
  );
}
