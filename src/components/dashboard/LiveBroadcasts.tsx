"use client";

import { useState, useCallback } from "react";
import { LIVE_CHANNELS, type LiveChannel } from "@/config/live-channels";

/**
 * Live news broadcast panel — YouTube embeds with channel tabs.
 * Mounts a single iframe at a time to avoid multiple video loads.
 */
export function LiveBroadcasts() {
  const [activeChannel, setActiveChannel] = useState<LiveChannel>(LIVE_CHANNELS[0]);
  const [isMuted, setIsMuted] = useState(true);

  const handleChannelSwitch = useCallback((channel: LiveChannel) => {
    setActiveChannel(channel);
  }, []);

  // Build YouTube embed URL — prefer videoId, fallback to channel live
  const embedUrl = activeChannel.videoId
    ? `https://www.youtube.com/embed/${activeChannel.videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&modestbranding=1&rel=0&showinfo=0`
    : `https://www.youtube.com/embed/live_stream?channel=${activeChannel.channelId}&autoplay=1&mute=${isMuted ? 1 : 0}`;

  return (
    <div className="h-full flex flex-col bg-hud-surface/50 border border-hud-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-hud-border flex items-center justify-between">
        <span className="hud-label text-[9px] flex items-center gap-1.5">
          <span className="text-severity-critical animate-blink">●</span>
          LIVE BROADCASTS
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="font-mono text-[8px] px-1.5 py-0.5 rounded border border-hud-border hover:bg-hud-panel/60 transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
          <span className="font-mono text-[8px] text-hud-muted">
            {LIVE_CHANNELS.length} channels
          </span>
        </div>
      </div>

      {/* Channel tabs — scrollable */}
      <div className="flex gap-0.5 px-2 py-1 border-b border-hud-border overflow-x-auto scrollbar-hide">
        {LIVE_CHANNELS.map((ch) => (
          <button
            key={ch.id}
            onClick={() => handleChannelSwitch(ch)}
            className={`shrink-0 px-2 py-0.5 font-mono text-[7px] tracking-wider rounded transition-all ${
              activeChannel.id === ch.id
                ? "text-hud-base font-bold"
                : "text-hud-muted border border-hud-border hover:text-hud-text hover:border-hud-text/30"
            }`}
            style={
              activeChannel.id === ch.id
                ? { backgroundColor: ch.color || "#00e5ff" }
                : undefined
            }
          >
            {ch.label}
          </button>
        ))}
      </div>

      {/* Video player */}
      <div className="flex-1 relative bg-hud-base min-h-0">
        <iframe
          key={activeChannel.id} // Force remount on channel change
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title={`${activeChannel.label} Live`}
          loading="lazy"
        />
        {/* Channel overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none flex items-end px-2 pb-1">
          <span className="font-mono text-[9px] text-white font-bold tracking-wider">
            {activeChannel.label}
          </span>
          <span className="font-mono text-[7px] text-white/60 ml-2">LIVE</span>
        </div>
      </div>
    </div>
  );
}
