"use client";

import { useTranslations } from "next-intl";

export type MapMode = "2d" | "3d";

interface MapViewToggleProps {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
}

/**
 * Simple 2D/3D map toggle.
 * Globe always shows intel events; all other data visible via layer toggles.
 */
export function MapViewToggle({ mode, onModeChange }: MapViewToggleProps) {
  const t = useTranslations();

  return (
    <div className="absolute top-12 left-3 z-[100] flex gap-0.5 bg-hud-panel/90 backdrop-blur-sm border border-hud-border rounded overflow-hidden">
      <button
        onClick={() => onModeChange("2d")}
        className={`flex items-center gap-1 px-2.5 py-1.5 transition-all font-mono text-[8px] tracking-wider ${
          mode === "2d" ? "bg-hud-accent/15 text-hud-accent" : "text-hud-muted hover:text-hud-text"
        }`}
      >
        <span className="text-[10px]">🗺️</span>
        {t("mapModes.tactical")}
      </button>
      <button
        onClick={() => onModeChange("3d")}
        className={`flex items-center gap-1 px-2.5 py-1.5 transition-all font-mono text-[8px] tracking-wider ${
          mode === "3d" ? "bg-hud-accent/15 text-hud-accent" : "text-hud-muted hover:text-hud-text"
        }`}
      >
        <span className="text-[10px]">🌍</span>
        {t("mapModes.globe")}
      </button>
    </div>
  );
}
