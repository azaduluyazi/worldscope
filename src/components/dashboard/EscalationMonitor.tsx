"use client";

import useSWR from "swr";

interface RegionEscalation {
  region: string;
  label: string;
  current24h: number;
  previous24h: number;
  trend: "rising" | "stable" | "declining";
  change: number;
}

interface EscalationData {
  regions: RegionEscalation[];
  globalTotal: number;
  timestamp: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TREND_CONFIG = {
  rising: { icon: "↑", color: "#ff4757", label: "RISING" },
  stable: { icon: "→", color: "#ffd000", label: "STABLE" },
  declining: { icon: "↓", color: "#00ff88", label: "DECLINING" },
};

export function EscalationMonitor() {
  const { data, isLoading } = useSWR<EscalationData>("/api/escalation", fetcher, {
    refreshInterval: 120_000,
  });

  if (isLoading) {
    return (
      <div className="glass-panel rounded-lg p-3">
        <div className="hud-label text-[8px] mb-2">◆ Escalation Monitor</div>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-hud-border rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  const regions = data?.regions || [];
  const maxEvents = Math.max(...regions.map((r) => r.current24h), 1);

  return (
    <div className="glass-panel rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="hud-label text-[8px]">◆ Escalation Monitor</span>
        <span className="font-mono text-[7px] text-hud-muted">
          24H EVENTS: <span className="text-hud-accent">{data?.globalTotal || 0}</span>
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {regions.map((region) => {
          const trend = TREND_CONFIG[region.trend];
          const barWidth = Math.max((region.current24h / maxEvents) * 100, 2);

          return (
            <div key={region.region} className="flex items-center gap-2">
              <span className="w-20 font-mono text-[7px] text-hud-muted uppercase truncate">
                {region.label}
              </span>
              <div className="flex-1 h-2 bg-hud-border/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${barWidth}%`,
                    background: `linear-gradient(90deg, ${trend.color}cc, ${trend.color}60)`,
                  }}
                />
              </div>
              <span className="font-mono text-[8px] font-bold w-5 text-right" style={{ color: trend.color }}>
                {region.current24h}
              </span>
              <span
                className="font-mono text-[8px] font-bold w-3"
                style={{ color: trend.color }}
                title={`${region.change > 0 ? "+" : ""}${region.change}% vs previous 24h`}
              >
                {trend.icon}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
