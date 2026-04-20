"use client";

import { useBookmarks } from "@/hooks/useBookmarks";
import { BookmarkButton } from "@/components/shared/BookmarkButton";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ff3b30",
  high: "#ff9500",
  medium: "#f5a524",
  low: "#6effb8",
  info: "#c5bfae",
};

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16).replace("T", " ");
}

export function SavedEvents() {
  const { bookmarks, loading, error } = useBookmarks();

  if (loading && bookmarks.length === 0) {
    return (
      <div className="text-xs text-gray-500 font-mono">Loading saved events…</div>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-red-400 font-mono">
        Couldn&apos;t load bookmarks: {error}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-xs text-gray-500 italic py-4 text-center border border-dashed border-gray-800 rounded-sm">
        No saved events yet. Click a ☆ on any intel row to pin it here.
      </div>
    );
  }

  return (
    <ul className="space-y-2 font-mono">
      {bookmarks.map((b) => {
        const e = b.events;
        if (!e) return null;
        const color = SEVERITY_COLOR[e.severity] ?? "#c5bfae";
        return (
          <li
            key={b.id}
            className="group flex items-start gap-3 p-2 border border-gray-800 hover:border-amber-400/30 rounded-sm bg-black/20"
          >
            <span
              aria-hidden="true"
              className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className="text-[8px] font-bold tracking-wider uppercase"
                  style={{ color }}
                >
                  {e.severity}
                </span>
                <span className="text-[8px] text-gray-500 tracking-wider uppercase">
                  {e.category}
                </span>
                {e.country_code && (
                  <span className="text-[8px] text-gray-500 tracking-wider">
                    {e.country_code}
                  </span>
                )}
                <span className="text-[8px] text-gray-600 ml-auto">
                  {formatDate(e.published_at)}
                </span>
              </div>
              {e.url ? (
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-gray-200 hover:text-amber-300 mt-1 leading-snug"
                >
                  {e.title}
                </a>
              ) : (
                <span className="block text-xs text-gray-200 mt-1 leading-snug">
                  {e.title}
                </span>
              )}
              {b.note && (
                <p className="text-[10px] text-gray-500 mt-1 italic">{b.note}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-[8px] text-gray-600 tracking-wider uppercase">
                <span>{e.source}</span>
                <BookmarkButton eventId={e.id} variant="compact" />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
