"use client";

import { useCallback, useState, useEffect } from "react";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelItem, Category } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";
import { addBookmark, isBookmarked } from "@/lib/bookmarks";
import { useNearbyWebcams } from "@/hooks/useNearbyWebcams";

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

  const { webcams, isLoading: webcamsLoading } = useNearbyWebcams(event?.lat, event?.lng);
  const [showPlayer, setShowPlayer] = useState<string | null>(null);

  // Reset player when event changes
  useEffect(() => {
    setShowPlayer(null);
  }, [event?.id]);

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

        {/* Nearby Webcam */}
        {event.lat != null && event.lng != null && (
          <div className="border-t border-hud-border pt-3 mt-3">
            {webcamsLoading && (
              <div className="font-mono text-[8px] text-hud-muted tracking-wider animate-pulse">
                SCANNING NEARBY WEBCAMS...
              </div>
            )}
            {!webcamsLoading && webcams.length > 0 && !showPlayer && (
              <div>
                <div className="font-mono text-[8px] text-hud-muted tracking-wider mb-1.5">NEARBY WEBCAM</div>
                <button
                  onClick={() => setShowPlayer(webcams[0].playerUrl)}
                  className="relative w-full rounded overflow-hidden border border-hud-border hover:border-hud-accent/40 transition-colors group"
                >
                  {webcams[0].imageUrl ? (
                    <img
                      src={webcams[0].imageUrl}
                      alt={webcams[0].title}
                      className="w-full h-28 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-28 bg-hud-base flex items-center justify-center">
                      <span className="text-hud-muted text-[10px] font-mono">NO PREVIEW</span>
                    </div>
                  )}
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/50 border border-white/30 flex items-center justify-center group-hover:bg-[#00e5ff]/20 group-hover:border-[#00e5ff]/50 transition-colors">
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="white">
                        <polygon points="6,3 20,12 6,21" />
                      </svg>
                    </div>
                  </div>
                  {/* Bottom info bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                    <div className="font-mono text-[8px] text-white truncate">{webcams[0].title}</div>
                    <div className="font-mono text-[7px] text-white/60">
                      {webcams[0].location.city}{webcams[0].location.country ? `, ${webcams[0].location.country}` : ""}
                    </div>
                  </div>
                </button>
              </div>
            )}
            {showPlayer && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-mono text-[8px] text-[#00e5ff] tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    LIVE WEBCAM
                  </div>
                  <button
                    onClick={() => setShowPlayer(null)}
                    className="font-mono text-[8px] text-hud-muted hover:text-hud-text"
                  >
                    ✕ CLOSE
                  </button>
                </div>
                <iframe
                  src={showPlayer}
                  className="w-full h-48 rounded border border-hud-border"
                  allow="autoplay"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        )}

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
