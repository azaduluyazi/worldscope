"use client";

import { useTranslations } from "next-intl";
import { SEVERITY_COLORS } from "@/types/intel";
import type { GeoHotspot } from "@/hooks/useAnalytics";

interface GeoHotspotsProps {
  data: GeoHotspot[];
}

export function GeoHotspots({ data }: GeoHotspotsProps) {
  const t = useTranslations("analytics");
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-4">
      <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
        ◆ {t("geoHotspots")}
      </div>
      <div className="space-y-1.5">
        {data.map((spot) => {
          const color = SEVERITY_COLORS[spot.topSeverity] || "#00e5ff";
          return (
            <div key={spot.region} className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-hud-muted w-16 shrink-0">
                📍 {spot.region}
              </span>
              <div className="flex-1 h-1.5 bg-hud-panel rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(spot.count / maxCount) * 100}%`,
                    backgroundColor: `${color}80`,
                  }}
                />
              </div>
              <span className="font-mono text-[8px] w-6 text-right" style={{ color }}>
                {spot.count}
              </span>
            </div>
          );
        })}
        {data.length === 0 && (
          <p className="font-mono text-[8px] text-hud-muted text-center py-4">{t("noData")}</p>
        )}
      </div>
    </div>
  );
}
