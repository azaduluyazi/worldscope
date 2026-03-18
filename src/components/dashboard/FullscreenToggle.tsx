"use client";

import { useState, useEffect, useCallback } from "react";

export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // F11 shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F11" || (e.key === "f" && e.ctrlKey)) {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  }, []);

  return (
    <button
      onClick={toggleFullscreen}
      className={`w-7 h-7 rounded-md flex items-center justify-center text-sm transition-all ${
        isFullscreen
          ? "bg-hud-accent/15 border border-hud-accent/30"
          : "bg-hud-panel border border-hud-border hover:border-hud-muted"
      }`}
      title={isFullscreen ? "Exit Fullscreen (F11)" : "Fullscreen (F11)"}
    >
      {isFullscreen ? "⊡" : "⛶"}
    </button>
  );
}
