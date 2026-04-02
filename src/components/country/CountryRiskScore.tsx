"use client";

import useSWR from "swr";

interface RiskData {
  countryCode: string;
  score: number;
  level: string;
  eventCount: number;
  categories: Record<string, number>;
  severities: Record<string, number>;
  period: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const LEVEL_COLORS: Record<string, string> = {
  critical: "#ff4757",
  high: "#ff7e3e",
  elevated: "#ffd000",
  moderate: "#00e5ff",
  low: "#00ff88",
};

interface CountryRiskScoreProps {
  countryCode: string;
}

export function CountryRiskScore({ countryCode }: CountryRiskScoreProps) {
  const { data, isLoading } = useSWR<RiskData>(
    `/api/analytics/country-risk?code=${countryCode}`,
    fetcher,
    { refreshInterval: 300_000, revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="glass-panel rounded-lg p-4 animate-pulse">
        <div className="h-5 bg-hud-border rounded w-32 mb-2" />
        <div className="h-12 bg-hud-border rounded w-20" />
      </div>
    );
  }

  const score = data?.score ?? 0;
  const level = data?.level ?? "low";
  const color = LEVEL_COLORS[level] || LEVEL_COLORS.low;
  const eventCount = data?.eventCount ?? 0;

  // Gauge arc calculation (0-100 → 0-180 degrees)
  const angle = (score / 100) * 180;

  return (
    <div className="glass-panel rounded-lg p-4">
      <div className="hud-label text-[8px] mb-3">◆ INSTABILITY INDEX (7D)</div>

      <div className="flex items-center gap-4">
        {/* Score gauge */}
        <div className="relative w-20 h-10">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            {/* Background arc */}
            <path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke="#1a2a3a"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Score arc */}
            <path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(angle / 180) * 141.4} 141.4`}
              style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0 text-center">
            <span
              className="font-mono text-xl font-bold"
              style={{ color, textShadow: `0 0 12px ${color}40` }}
            >
              {score}
            </span>
          </div>
        </div>

        {/* Level + stats */}
        <div className="flex-1">
          <div
            className="font-mono text-[11px] font-bold tracking-wider"
            style={{ color }}
          >
            {level.toUpperCase()}
          </div>
          <div className="font-mono text-[8px] text-hud-muted mt-1">
            {eventCount} events in 7 days
          </div>
          {data?.severities && (
            <div className="flex gap-2 mt-1.5">
              {Object.entries(data.severities).map(([sev, count]) => (
                <span
                  key={sev}
                  className="font-mono text-[7px] px-1 py-0.5 rounded"
                  style={{
                    backgroundColor: `${LEVEL_COLORS[sev] || "#666"}15`,
                    color: LEVEL_COLORS[sev] || "#666",
                  }}
                >
                  {(sev as string).toUpperCase()}: {count as number}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
