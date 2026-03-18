"use client";

import { useState, useCallback } from "react";
import {
  LIVE_WEBCAMS,
  WEBCAM_REGIONS,
  type LiveWebcam,
} from "@/config/live-channels";

/**
 * Live webcam grid — YouTube embeds from key global cities.
 * Features: region filter, expand-to-play, thumbnail loading, connection status.
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
          <span className="text-severity-critical live-glow inline-block w-1.5 h-1.5 rounded-full bg-severity-critical" />
          LIVE WEBCAMS
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[8px] text-hud-muted">
            {filteredCams.length} active
          </span>
          {expandedCam && (
            <button
              onClick={() => setExpandedCam(null)}
              className="font-mono text-[7px] text-hud-accent hover:text-hud-text transition-colors"
            >
              ◆ GRID
            </button>
          )}
        </div>
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

      {/* Content */}
      <div className="flex-1 overflow-hidden p-1">
        {expandedCam ? (
          <ExpandedCamView
            cam={filteredCams.find((c) => c.id === expandedCam)}
            onClose={() => setExpandedCam(null)}
          />
        ) : (
          <div className="grid grid-cols-2 gap-1 h-full auto-rows-fr">
            {filteredCams.map((cam) => (
              <WebcamThumbnail
                key={cam.id}
                cam={cam}
                onClick={() => handleCamClick(cam)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Expanded single webcam view with live iframe */
function ExpandedCamView({
  cam,
  onClose,
}: {
  cam: LiveWebcam | undefined;
  onClose: () => void;
}) {
  if (!cam) return null;

  return (
    <div className="h-full flex flex-col gap-1 fade-slide-in">
      <div className="flex-1 relative bg-hud-base rounded overflow-hidden min-h-0">
        <iframe
          src={`https://www.youtube.com/embed/${cam.videoId}?autoplay=1&mute=1&controls=1&modestbranding=1`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={`${cam.city} Webcam`}
          loading="lazy"
        />
        {/* City overlay */}
        <div className="absolute top-2 left-3 flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full live-glow"
            style={{ backgroundColor: cam.color, color: cam.color }}
          />
          <span className="font-mono text-[11px] text-white font-bold drop-shadow-lg tracking-wider">
            {cam.city}
          </span>
          <span className="font-mono text-[8px] text-white/50 bg-black/40 px-1.5 py-0.5 rounded">
            {cam.country}
          </span>
        </div>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 font-mono text-[8px] text-white/60 hover:text-white bg-black/40 hover:bg-black/60 px-2 py-1 rounded transition-colors"
        >
          ✕ CLOSE
        </button>
      </div>
    </div>
  );
}

/** Webcam thumbnail card with hover effects */
function WebcamThumbnail({
  cam,
  onClick,
}: {
  cam: LiveWebcam;
  onClick: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <button
      onClick={onClick}
      className="relative bg-hud-base rounded overflow-hidden border border-hud-border hover:border-hud-accent/50 transition-all group"
    >
      {/* Loading shimmer */}
      {!imgLoaded && (
        <div className="absolute inset-0 loading-shimmer" />
      )}

      {/* Thumbnail */}
      <img
        src={`https://img.youtube.com/vi/${cam.videoId}/mqdefault.jpg`}
        alt={`${cam.city} webcam`}
        className={`w-full h-full object-cover transition-all duration-300 ${
          imgLoaded
            ? "opacity-70 group-hover:opacity-95 group-hover:scale-105"
            : "opacity-0"
        }`}
        loading="lazy"
        onLoad={() => setImgLoaded(true)}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

      {/* City label */}
      <div className="absolute top-1.5 left-2 flex items-center gap-1">
        <div
          className="w-1.5 h-1.5 rounded-full live-glow"
          style={{ backgroundColor: cam.color, color: cam.color }}
        />
        <span className="font-mono text-[8px] text-white font-bold drop-shadow-lg">
          {cam.city}
        </span>
      </div>

      {/* Country badge */}
      <div className="absolute bottom-1.5 right-2">
        <span className="font-mono text-[6px] text-white/50 bg-black/40 px-1 py-0.5 rounded">
          {cam.country}
        </span>
      </div>

      {/* Play icon on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <span className="text-white text-sm ml-0.5">▶</span>
        </div>
      </div>
    </button>
  );
}
