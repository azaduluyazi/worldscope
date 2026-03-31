"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type PlaybackSpeed = 1 | 1.5 | 2;

/**
 * Mini podcast player — daily AI briefing audio.
 * Compact bar (~36px) with play/pause, progress, speed, volume, download.
 */
export function PodcastPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [volume, setVolume] = useState(0.8);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const audioUrl = "/api/podcast/generate";

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
      setLoaded(true);
    });
    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration > 0) {
        setProgress(audio.currentTime / audio.duration);
      }
    });
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    });
    audio.addEventListener("error", () => {
      setError(true);
      setIsPlaying(false);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.src || audio.src === "") {
      audio.src = audioUrl;
      audio.load();
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => setError(true));
      setIsPlaying(true);
    }
  }, [isPlaying, audioUrl]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const next: PlaybackSpeed = prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1;
      if (audioRef.current) audioRef.current.playbackRate = next;
      return next;
    });
  }, []);

  const toggleVolume = useCallback(() => {
    setVolume((prev) => {
      const next = prev > 0 ? 0 : 0.8;
      if (audioRef.current) audioRef.current.volume = next;
      return next;
    });
  }, []);

  const formatTime = (sec: number): string => {
    if (!sec || !isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-hud-surface/70 border border-hud-border/50 rounded px-2.5 py-1.5 flex items-center gap-2 h-9">
      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        disabled={error}
        className="font-mono text-[11px] text-hud-accent hover:text-hud-text transition-colors shrink-0 cursor-pointer disabled:opacity-40"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "II" : "\u25B6"}
      </button>

      {/* Title */}
      <span className="font-mono text-[8px] text-hud-muted shrink-0 hidden sm:inline">
        BRIEFING {today}
      </span>

      {/* Progress bar */}
      <div
        className="flex-1 h-1 bg-hud-border/30 rounded-full cursor-pointer relative group"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-hud-accent rounded-full transition-all duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Time display */}
      <span className="font-mono text-[8px] text-hud-muted shrink-0 tabular-nums w-[68px] text-right">
        {formatTime(currentTime)} / {loaded ? formatTime(duration) : "--:--"}
      </span>

      {/* Speed toggle */}
      <button
        onClick={cycleSpeed}
        className="font-mono text-[8px] text-hud-muted hover:text-hud-accent transition-colors shrink-0 cursor-pointer w-5 text-center"
        title="Playback speed"
      >
        {speed}x
      </button>

      {/* Volume */}
      <button
        onClick={toggleVolume}
        className="font-mono text-[9px] text-hud-muted hover:text-hud-accent transition-colors shrink-0 cursor-pointer"
        title={volume > 0 ? "Mute" : "Unmute"}
      >
        {volume > 0 ? "\u{1F50A}" : "\u{1F507}"}
      </button>

      {/* Download */}
      <a
        href={audioUrl}
        download={`worldscope-briefing-${today}.mp3`}
        className="font-mono text-[9px] text-hud-muted hover:text-hud-accent transition-colors shrink-0"
        title="Download MP3"
      >
        \u2B07
      </a>
    </div>
  );
}
