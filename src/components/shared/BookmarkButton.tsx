"use client";

import { useBookmarks } from "@/hooks/useBookmarks";
import { useAuth } from "@clerk/nextjs";

interface BookmarkButtonProps {
  eventId: string;
  /** Compact = icon only, full = icon + label. */
  variant?: "compact" | "full";
  /** Custom class for outer button. */
  className?: string;
}

/**
 * Reusable bookmark toggle. Renders a subtle outline star when the
 * event is not saved and a filled amber star when it is. Silently
 * hides for signed-out visitors so the feed stays clean — a CTA to
 * sign in lives in the TopBar.
 */
export function BookmarkButton({ eventId, variant = "compact", className }: BookmarkButtonProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { ids, toggle, loading } = useBookmarks();

  if (!isLoaded || !isSignedIn) return null;

  const saved = ids.has(eventId);
  const icon = saved ? "★" : "☆";
  const label = saved ? "SAVED" : "SAVE";
  const base =
    "inline-flex items-center gap-1 font-mono text-[9px] tracking-wider transition-colors disabled:opacity-50";
  const color = saved
    ? "text-hud-accent hover:text-hud-accent/80"
    : "text-hud-muted hover:text-hud-accent";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(eventId);
      }}
      aria-pressed={saved}
      aria-label={saved ? "Remove bookmark" : "Save event"}
      disabled={loading}
      className={[base, color, className].filter(Boolean).join(" ")}
    >
      <span className="text-[12px] leading-none">{icon}</span>
      {variant === "full" && <span>{label}</span>}
    </button>
  );
}
