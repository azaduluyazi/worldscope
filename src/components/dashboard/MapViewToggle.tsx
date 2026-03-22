"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";

export type MapMode = "2d" | "globe-intel" | "globe-flights" | "globe-ships" | "globe-cables";

const MAP_MODES: Array<{ id: MapMode; icon: string; labelKey: string }> = [
  { id: "2d", icon: "🗺️", labelKey: "mapModes.tactical" },
  { id: "globe-intel", icon: "🌍", labelKey: "mapModes.intel" },
  { id: "globe-flights", icon: "✈️", labelKey: "mapModes.flights" },
  { id: "globe-ships", icon: "🚢", labelKey: "mapModes.ships" },
  { id: "globe-cables", icon: "🌡️", labelKey: "mapModes.weather" },
];

interface MapViewToggleProps {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
}

/**
 * Map mode selector — 2D tactical + 4 specialized 3D globe views.
 */
export function MapViewToggle({ mode, onModeChange }: MapViewToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations();

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const current = MAP_MODES.find((m) => m.id === mode) || MAP_MODES[0];

  return (
    <div ref={ref} className="absolute top-12 left-3 z-[100]">
      {/* Current mode button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-hud-panel/90 backdrop-blur-sm border border-hud-border rounded px-2 py-1 hover:border-hud-accent/50 transition-all group"
      >
        <span className="text-[10px]">{current.icon}</span>
        <span className="font-mono text-[7px] text-hud-muted group-hover:text-hud-accent tracking-wider">
          {t(current.labelKey)}
        </span>
        <span className={`text-[6px] text-hud-muted transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 z-[200] bg-hud-panel/95 backdrop-blur-sm border border-hud-border rounded-lg shadow-lg shadow-black/50 overflow-hidden min-w-[160px]">
          {MAP_MODES.map((m) => {
            const isActive = m.id === mode;
            return (
              <button
                key={m.id}
                onClick={() => {
                  onModeChange(m.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 transition-all ${
                  isActive
                    ? "bg-hud-accent/15 text-hud-accent"
                    : "text-hud-muted hover:bg-hud-surface hover:text-hud-text"
                }`}
              >
                <span className="text-[11px]">{m.icon}</span>
                <span className="font-mono text-[8px] tracking-wider">{t(m.labelKey)}</span>
                {isActive && <span className="ml-auto text-[8px]">●</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
