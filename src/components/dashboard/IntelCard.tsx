"use client";

import type { IntelItem } from "@/types/intel";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import { timeAgo } from "@/lib/utils/date";
import { truncate } from "@/lib/utils/sanitize";
import { isBookmarked, addBookmark, removeBookmark } from "@/lib/bookmarks";
import { useState, useCallback } from "react";

interface IntelCardProps {
  item: IntelItem;
  onPreview?: (item: IntelItem) => void;
  onSpeak?: (text: string) => void;
}

export function IntelCard({ item, onPreview, onSpeak }: IntelCardProps) {
  const severityColor = SEVERITY_COLORS[item.severity];
  const icon = CATEGORY_ICONS[item.category] || "📄";
  const hasGeo = item.lat != null && item.lng != null;
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(item.id));

  const handleClick = (e: React.MouseEvent) => {
    if (onPreview) {
      e.preventDefault();
      onPreview(item);
    }
  };

  const handleBookmark = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarked) {
      removeBookmark(item.id);
      setBookmarked(false);
    } else {
      addBookmark({
        id: item.id,
        title: item.title,
        url: item.url || "",
        category: item.category,
        severity: item.severity,
        source: item.source,
      });
      setBookmarked(true);
    }
  }, [bookmarked, item]);

  const handleSpeak = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSpeak) {
      onSpeak(`${item.title}. ${item.summary || ""}`);
    }
  }, [onSpeak, item]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${item.severity} ${item.category}: ${truncate(item.title, 60)}`}
      className={`severity-${item.severity} group block w-full text-left rounded-r-md p-2.5 transition-all duration-200 hover:brightness-125 hover:translate-x-0.5 animate-slide-in cursor-pointer`}
    >
      <div className="flex justify-between items-center mb-1">
        <span
          className="font-mono text-[9px] font-bold tracking-wider flex items-center gap-1"
          style={{ color: severityColor }}
        >
          <span className="text-[10px]">{icon}</span>
          {item.severity.toUpperCase()} — {item.category.toUpperCase()}
          {hasGeo && <span className="text-hud-accent text-[7px] ml-1" title="Geo-located">📍</span>}
        </span>
        <div className="flex items-center gap-1.5">
          {/* TTS button */}
          {onSpeak && (
            <span
              onClick={handleSpeak}
              title="Read aloud"
              className="text-[10px] text-hud-muted hover:text-hud-accent cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            >
              🔊
            </span>
          )}
          {/* Bookmark button */}
          <span
            onClick={handleBookmark}
            title={bookmarked ? "Remove bookmark" : "Bookmark"}
            className={`text-[10px] cursor-pointer transition-opacity ${bookmarked ? "text-hud-accent opacity-100" : "text-hud-muted hover:text-hud-accent opacity-0 group-hover:opacity-100"}`}
          >
            {bookmarked ? "★" : "☆"}
          </span>
          <span className="font-mono text-[8px] text-hud-muted">
            {timeAgo(item.publishedAt)}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-hud-text leading-relaxed group-hover:text-white transition-colors">
        {truncate(item.title, 120)}
      </p>

      <div className="flex justify-between items-center mt-1.5">
        <span className="font-mono text-[7px] text-hud-muted">
          {item.source}
        </span>
        <span className="font-mono text-[7px] text-hud-accent opacity-0 group-hover:opacity-100 transition-opacity">
          PREVIEW →
        </span>
      </div>
    </button>
  );
}
