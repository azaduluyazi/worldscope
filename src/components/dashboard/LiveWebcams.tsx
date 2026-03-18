"use client";

import { useState, useCallback } from "react";
import {
  LIVE_WEBCAMS,
  WEBCAM_REGIONS,
  type LiveWebcam,
} from "@/config/live-channels";

/**
 * Live webcam grid — YouTube embeds from key global cities.
 * Filters by region. Only active webcam plays video; others show thumbnails.
 */
export function LiveWebcams() {
  const [activeRegion, setActiveRegion] = useState<string>("all");
  const [expandedCam, setExpandedCam] = useState<string | null>(null);

  const filteredCams =
    activeRegion === "all"
      ? LIVE_WEBCAMS
      : LIVE_WEBCAMS.filter((c) => c.region === activeRegion);

  const handleCamClick = useCallback((cam: LiveWebcam) => {
    setExpandedCam((prev) => (prev === cam.id ? null : cam.id));
  }, []);

  return (
    <div className="h-full flex flex-col bg-hud-surface/50 border border-hud-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-hud-border flex items-center justify-between">
        <span className="hud-label text-[9px] flex items-center gap-1.5">
          <span className="text-severity-critical animate-blink">●</span>
          LIVE WEBCAMS
        </span>
        <span className="font-mono text-[8px] text-hud-muted">
          {filteredCams.length} active
        </span>
      </div>

      {/* Region tabs */}
      <div className="flex gap-0.5 px-2 py-1 border-b border-hud-border overflow-x-auto scrollbar-hide">
        {WEBCAM_REGIONS.map((region) => (
          <button
            key={region.id}
            onClick={() => {
              setActiveRegion(region.id);
              setExpandedCam(null);
            }}
            className={`shrink-0 px-2 py-0.5 font-mono text-[7px] tracking-wider rounded transition-all ${
              activeRegion === region.id
                ? "bg-hud-accent text-hud-base font-bold"
                : "text-hud-muted border border-hud-border hover:text-hud-text"
            }`}
          >
            {region.label}
          </button>
        ))}
      </div>

      {/* Webcam grid */}
      <div className="flex-1 overflow-y-auto p-1.5">
        {expandedCam ? (
          /* Expanded single cam view */
          <div className="h-full flex flex-col gap-1">
            {(() => {
              const cam = filteredCams.find((c) => c.id === expandedCam);
              if (!cam) return null;
              return (
                <>
                  <div className="flex-1 relative bg-hud-base rounded overflow-hidden min-h-0">
                    <iframe
                      src={`https://www.youtube.com/embed/${cam.videoId}?autoplay=1&mute=1&controls=1&modestbranding=1`}
                      className="absolute inset-0 w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      title={`${cam.city} Webcam`}
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full animate-blink"
                        style={{ backgroundColor: cam.color }}
                      />
                      <span className="font-mono text-[9px] text-white font-bold drop-shadow-lg">
                        {cam.city}
                      </span>
                      <span className="font-mono text-[7px] text-white/60">
                        {cam.country}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedCam(null)}
                    className="font-mono text-[8px] text-hud-muted hover:text-hud-accent py-1 transition-colors"
                  >
                    ← BACK TO GRID
                  </button>
                </>
              );
            })()}
          </div>
        ) : (
          /* Grid view */
          <div className="grid grid-cols-2 gap-1 h-full">
            {filteredCams.map((cam) => (
              <button
                key={cam.id}
                onClick={() => handleCamClick(cam)}
                className="relative bg-hud-base rounded overflow-hidden border border-hud-border hover:border-hud-accent/50 transition-all group"
              >
                {/* Thumbnail — YouTube thumbnail image */}
                <img
                  src={`https://img.youtube.com/vi/${cam.videoId}/mqdefault.jpg`}
                  alt={`${cam.city} webcam`}
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                  loading="lazy"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {/* City label */}
                <div className="absolute top-1.5 left-2 flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-blink"
                    style={{ backgroundColor: cam.color }}
                  />
                  <span className="font-mono text-[8px] text-white font-bold drop-shadow-lg">
                    {cam.city}
                  </span>
                </div>
                {/* Country badge */}
                <div className="absolute bottom-1.5 right-2">
                  <span className="font-mono text-[6px] text-white/50">
                    {cam.country}
                  </span>
                </div>
                {/* Play icon on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white/80 text-lg">▶</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
