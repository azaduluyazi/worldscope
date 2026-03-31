"use client";

import { useCallback, useState } from "react";
import type { TimelineBin } from "@/hooks/useTimelineData";

interface TimelineSliderProps {
  bins: TimelineBin[];
  currentIndex: number;
  onChange: (index: number) => void;
  isPlaying: boolean;
  onPlay: (speed?: number) => void;
  onPause: () => void;
}

const SPEED_OPTIONS = [0.5, 1, 2] as const;

function formatBinTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}/${day} ${h}:${m}`;
}

/**
 * Compact timeline slider for scrubbing through 48h of events on the map.
 * Shows a sparkline of event counts, time labels, and play/pause/speed controls.
 */
export function TimelineSlider({
  bins,
  currentIndex,
  onChange,
  isPlaying,
  onPlay,
  onPause,
}: TimelineSliderProps) {
  const [speed, setSpeed] = useState<(typeof SPEED_OPTIONS)[number]>(1);

  const maxCount = Math.max(1, ...bins.map((b) => b.count));
  const currentBin = bins[currentIndex];

  const handleSpeedCycle = useCallback(() => {
    const idx = SPEED_OPTIONS.indexOf(speed);
    const nextSpeed = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setSpeed(nextSpeed);
    if (isPlaying) {
      onPlay(nextSpeed);
    }
  }, [speed, isPlaying, onPlay]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay(speed);
    }
  }, [isPlaying, onPlay, onPause, speed]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange]
  );

  if (bins.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5 w-full px-2 select-none">
      {/* ── Sparkline: mini bar chart of event counts per bin ── */}
      <div className="flex items-end gap-px h-3 w-full" aria-hidden="true">
        {bins.map((bin, i) => {
          const height = bin.count > 0 ? Math.max(2, (bin.count / maxCount) * 12) : 0;
          const isCurrent = i === currentIndex;
          const isPast = i <= currentIndex;
          return (
            <div
              key={i}
              className="flex-1 min-w-0 rounded-t-sm transition-colors duration-100"
              style={{
                height: `${height}px`,
                backgroundColor: isCurrent
                  ? "#00e5ff"
                  : isPast
                    ? "#00e5ff40"
                    : bin.count > 0
                      ? "#5a7a9a30"
                      : "transparent",
                boxShadow: isCurrent && bin.count > 0 ? "0 0 4px #00e5ff60" : undefined,
              }}
            />
          );
        })}
      </div>

      {/* ── Controls row ── */}
      <div className="flex items-center gap-2">
        {/* Play/Pause */}
        <button
          type="button"
          onClick={handlePlayPause}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded bg-hud-surface border border-hud-border hover:border-[#00e5ff40] transition-colors text-[10px] text-hud-accent"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        {/* Speed */}
        <button
          type="button"
          onClick={handleSpeedCycle}
          className="flex-shrink-0 font-mono text-[8px] text-hud-muted hover:text-hud-accent px-1 py-0.5 rounded bg-hud-surface border border-hud-border hover:border-[#00e5ff40] transition-colors tabular-nums"
          title="Cycle playback speed"
        >
          {speed}x
        </button>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={bins.length - 1}
          value={currentIndex}
          onChange={handleSliderChange}
          className="flex-1 h-1 appearance-none bg-hud-border rounded-full cursor-pointer accent-[#00e5ff]
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00e5ff]
            [&::-webkit-slider-thumb]:shadow-[0_0_6px_#00e5ff80] [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[#00e5ff] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          aria-label="Timeline scrubber"
        />

        {/* Current time label */}
        <span className="flex-shrink-0 font-mono text-[8px] text-hud-accent tabular-nums tracking-wider min-w-[72px] text-right">
          {currentBin ? formatBinTime(currentBin.startTime) : "--"}
        </span>

        {/* Event count in current bin */}
        <span className="flex-shrink-0 font-mono text-[7px] text-hud-muted tabular-nums min-w-[24px] text-right">
          {currentBin ? currentBin.count : 0}
        </span>
      </div>
    </div>
  );
}
