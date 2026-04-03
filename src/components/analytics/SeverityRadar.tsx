"use client";

import { useTranslations } from "next-intl";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { CategoryCount } from "@/hooks/useAnalytics";

interface SeverityRadarProps {
  data: CategoryCount[];
}

function HudTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-hud-surface/95 backdrop-blur-sm border border-hud-border rounded-md p-2 shadow-lg">
      <span className="font-mono text-[9px] text-hud-text">
        {payload[0].name}: <span className="text-hud-accent">{payload[0].value}</span>
      </span>
    </div>
  );
}

export function SeverityRadar({ data }: SeverityRadarProps) {
  const t = useTranslations("analytics");

  const radarData = data.slice(0, 8).map((d) => ({
    category: d.category.toUpperCase(),
    count: d.count,
    fullMark: Math.max(...data.map((x) => x.count)) || 1,
  }));

  if (radarData.length < 3) return null;

  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-4">
      <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
        ◆ {t("categoryBreakdown")} — Radar
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#1a2a4a" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "#5a7a9a", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }}
          />
          <PolarRadiusAxis
            tick={{ fill: "#3a5a7a", fontSize: 7 }}
            axisLine={false}
          />
          <Radar
            name="Events"
            dataKey="count"
            stroke="#00e5ff"
            fill="#00e5ff"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip content={<HudTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
