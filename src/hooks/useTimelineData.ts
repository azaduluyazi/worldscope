import { useState, useRef, useCallback, useMemo } from "react";
import type { IntelItem } from "@/types/intel";

export interface TimelineBin {
  startTime: Date;
  endTime: Date;
  items: IntelItem[];
  count: number;
}

interface UseTimelineDataProps {
  items: IntelItem[];
  /** Bin width in minutes (default 30) */
  binMinutes?: number;
}

interface UseTimelineDataReturn {
  bins: TimelineBin[];
  currentBinIndex: number;
  setCurrentBinIndex: (index: number) => void;
  isPlaying: boolean;
  play: (speedMultiplier?: number) => void;
  pause: () => void;
}

const DEFAULT_BIN_MINUTES = 30;
const HOURS_48 = 48 * 60 * 60 * 1000;

/**
 * Build time bins for the given items. Pure function — "now" is passed in.
 */
function buildBins(items: IntelItem[], binMinutes: number, now: number): TimelineBin[] {
  const windowStart = now - HOURS_48;
  const binMs = binMinutes * 60 * 1000;
  const binCount = Math.ceil(HOURS_48 / binMs);

  const result: TimelineBin[] = [];

  for (let i = 0; i < binCount; i++) {
    const startMs = windowStart + i * binMs;
    const endMs = Math.min(startMs + binMs, now);
    result.push({
      startTime: new Date(startMs),
      endTime: new Date(endMs),
      items: [],
      count: 0,
    });
  }

  for (const item of items) {
    const pubMs = new Date(item.publishedAt).getTime();
    if (pubMs < windowStart || pubMs > now) continue;
    const binIdx = Math.min(
      Math.floor((pubMs - windowStart) / binMs),
      binCount - 1
    );
    result[binIdx].items.push(item);
    result[binIdx].count++;
  }

  return result;
}

/**
 * Bins events into time intervals over the last 48 hours.
 * Provides play/pause controls for auto-advancing through bins.
 */
export function useTimelineData({
  items,
  binMinutes = DEFAULT_BIN_MINUTES,
}: UseTimelineDataProps): UseTimelineDataReturn {
  const [currentBinIndex, setCurrentBinIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedRef = useRef(1);

  // Derive anchor time from the data itself (pure — no Date.now in render).
  // Use the latest item's publishedAt or fall back to epoch.
  const anchorMs = useMemo(() => {
    if (items.length === 0) return 0;
    let latest = 0;
    for (const item of items) {
      const t = new Date(item.publishedAt).getTime();
      if (t > latest) latest = t;
    }
    // Round up to next bin boundary so the latest item is included
    const binMs = binMinutes * 60 * 1000;
    return Math.ceil(latest / binMs) * binMs;
  }, [items, binMinutes]);

  const bins = useMemo(
    () => (anchorMs > 0 ? buildBins(items, binMinutes, anchorMs) : []),
    [items, binMinutes, anchorMs]
  );

  // ── Cleanup interval on unmount ──
  const clearPlayInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Play: auto-advance bins at configurable speed ──
  const play = useCallback(
    (speedMultiplier = 1) => {
      clearPlayInterval();
      speedRef.current = speedMultiplier;
      setIsPlaying(true);

      const baseDelay = 500; // ms per bin at 1x
      const delay = baseDelay / speedMultiplier;

      intervalRef.current = setInterval(() => {
        setCurrentBinIndex((prev) => {
          const next = prev + 1;
          if (next >= bins.length) {
            clearPlayInterval();
            setIsPlaying(false);
            return prev;
          }
          return next;
        });
      }, delay);
    },
    [bins.length, clearPlayInterval]
  );

  // ── Pause ──
  const pause = useCallback(() => {
    clearPlayInterval();
    setIsPlaying(false);
  }, [clearPlayInterval]);

  return {
    bins,
    currentBinIndex,
    setCurrentBinIndex,
    isPlaying,
    play,
    pause,
  };
}
