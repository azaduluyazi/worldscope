"use client";

interface MapHUDProps {
  eventCount: number;
  layerCount: number;
  totalLayers: number;
}

export function MapHUD({ eventCount, layerCount, totalLayers }: MapHUDProps) {
  return (
    <>
      {/* Grid overlay */}
      <div className="grid-overlay" />

      {/* HUD corners */}
      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-hud-accent/30 pointer-events-none" />
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-hud-accent/30 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-hud-accent/30 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-hud-accent/30 pointer-events-none" />

      {/* Bottom left info */}
      <div className="absolute bottom-3 left-3 font-mono text-[9px] z-10 pointer-events-none">
        <span className="text-hud-accent">◆ ACTIVE EVENTS: </span>
        <span className="text-severity-critical">{eventCount}</span>
        <span className="text-hud-muted mx-1.5">|</span>
        <span className="text-hud-accent">LAYERS: </span>
        <span className="text-hud-muted">{layerCount}/{totalLayers}</span>
      </div>

      {/* Top left label */}
      <div className="absolute top-3 left-3 font-mono text-[8px] text-hud-muted z-10 pointer-events-none">
        <div>◆ GLOBAL TACTICAL VIEW</div>
      </div>
    </>
  );
}
