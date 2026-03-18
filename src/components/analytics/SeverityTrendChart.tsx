"use client";

import { useTranslations } from "next-intl";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { SeverityBucket } from "@/hooks/useAnalytics";

const SEVERITY_COLORS = {
  critical: "#ff4757",
  high: "#ffd000",
  medium: "#00e5ff",
  low: "#00ff88",
  info: "#8a5cf6",
};

interface SeverityTrendChartProps {
  data: SeverityBucket[];
}

function HudTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-hud-surface/95 backdrop-blur-sm border border-hud-border rounded-md p-2 shadow-lg">
      <p className="font-mono text-[8px] text-hud-accent mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="font-mono text-[7px] text-hud-muted uppercase w-12">{entry.name}</span>
          <span className="font-mono text-[8px] text-hud-text">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function SeverityTrendChart({ data }: SeverityTrendChartProps) {
  const t = useTranslations("analytics");

  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-4">
      <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
        ◆ {t("severityTrend")}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2a4a" />
          <XAxis
            dataKey="label"
            tick={{ fill: "#5a7a9a", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={{ stroke: "#1a2a4a" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#5a7a9a", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<HudTooltip />} />
          <Legend
            iconType="circle"
            iconSize={6}
            wrapperStyle={{ fontSize: 8, fontFamily: "JetBrains Mono, monospace" }}
          />
          <Area type="monotone" dataKey="critical" stackId="1" stroke={SEVERITY_COLORS.critical} fill={`${SEVERITY_COLORS.critical}40`} />
          <Area type="monotone" dataKey="high" stackId="1" stroke={SEVERITY_COLORS.high} fill={`${SEVERITY_COLORS.high}30`} />
          <Area type="monotone" dataKey="medium" stackId="1" stroke={SEVERITY_COLORS.medium} fill={`${SEVERITY_COLORS.medium}20`} />
          <Area type="monotone" dataKey="low" stackId="1" stroke={SEVERITY_COLORS.low} fill={`${SEVERITY_COLORS.low}15`} />
          <Area type="monotone" dataKey="info" stackId="1" stroke={SEVERITY_COLORS.info} fill={`${SEVERITY_COLORS.info}10`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
