"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface HlsPlayerProps {
  src: string;
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
  /** Called once the stream has enough data to start playback (session 17 health check) */
  onLoadedData?: () => void;
  /** Called on fatal/unrecoverable stream error — used by parent to auto-blacklist broken channels */
  onError?: () => void;
}

/**
 * HLS video player using hls.js for cross-browser support.
 * Falls back to native video for Safari (which supports HLS natively).
 *
 * Session 17 change: onError fires on fatal HLS errors AND on network/manifest
 * load failures after a short retry window, so the LiveBroadcasts parent can
 * mark the channel broken and advance to the next one automatically.
 */
export default function HlsPlayer({
  src,
  autoPlay = true,
  muted = true,
  className,
  onLoadedData,
  onError,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Reset retry counter for this mount
    let networkRetries = 0;
    const MAX_NETWORK_RETRIES = 2;

    // Safari supports HLS natively
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      if (autoPlay) video.play().catch(() => {});
      return;
    }

    // Use hls.js for other browsers
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 10,
        maxMaxBufferLength: 30,
        manifestLoadingMaxRetry: 2,
        manifestLoadingTimeOut: 8000,
        levelLoadingMaxRetry: 2,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (networkRetries < MAX_NETWORK_RETRIES) {
              networkRetries++;
              hls.startLoad(); // retry once or twice
            } else {
              // Persistent network failure → treat as broken, notify parent
              hls.destroy();
              onError?.();
            }
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            hls.destroy();
            onError?.();
            break;
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }
  }, [src, autoPlay, onError]);

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay={autoPlay}
      muted={muted}
      playsInline
      controls
      style={{ background: "#000" }}
      onLoadedData={() => onLoadedData?.()}
      onError={() => onError?.()}
    />
  );
}
