"use client";

interface MapViewToggleProps {
  is3D: boolean;
  onToggle: () => void;
}

/**
 * Toggle between 2D (Mapbox) and 3D (Globe.gl) map views.
 * Positioned in the top-right corner of the map container.
 */
export function MapViewToggle({ is3D, onToggle }: MapViewToggleProps) {
  return (
    <div className="absolute top-3 right-3 z-20">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 bg-hud-panel/90 backdrop-blur-sm border border-hud-border rounded px-2 py-1 hover:border-hud-accent/50 transition-all group"
        title={is3D ? "Switch to 2D Map" : "Switch to 3D Globe"}
      >
        <span className="font-mono text-[8px] text-hud-muted group-hover:text-hud-accent transition-colors">
          {is3D ? "2D" : "3D"}
        </span>
        <span className="text-[10px]">{is3D ? "🗺️" : "🌍"}</span>
      </button>
    </div>
  );
}
