"use client";

import { useThreatIndex } from "@/hooks/useThreatIndex";
import { THREAT_CATEGORIES } from "@/config/threat-categories";

const LEVEL_COLORS = {
  critical: "#ff4757",
  high: "#ffd000",
  elevated: "#ff7e3e",
  low: "#00ff88",
};

export function ThreatIndex() {
  const { score, level, categories, isLoading } = useThreatIndex();

  const color = LEVEL_COLORS[level];

  return (
    <div className="glass-panel rounded-lg p-3">
      <div className="hud-label text-[8px] mb-2">◆ Global Threat Index</div>

      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-7 bg-hud-border rounded w-16 mb-1" />
          <div className="h-2 bg-hud-border rounded w-24" />
        </div>
      ) : (
        <>
          <div
            className="font-mono text-2xl font-bold"
            style={{ color, textShadow: `0 0 20px ${color}40` }}
          >
            {score}
          </div>
          <div className="font-mono text-[9px]" style={{ color }}>
            {level.toUpperCase()}
          </div>

          <div className="mt-3 flex flex-col gap-1.5">
            {THREAT_CATEGORIES.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2">
                <span className="w-14 font-mono text-[8px] text-hud-muted uppercase">
                  {cat.label}
                </span>
                <div className="flex-1 h-1 bg-hud-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${categories[cat.id.replace("military", "conflict")] || 0}%`,
                      background: `linear-gradient(90deg, ${cat.color}, ${cat.color}aa)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
