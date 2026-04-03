"use client";

import { useTranslations } from "next-intl";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { CategoryCount } from "@/hooks/useAnalytics";

const COLORS = [
  "#ff4757", "#ffd000", "#00e5ff", "#8a5cf6", "#00ff88",
  "#ff9f43", "#c471ed", "#1dd1a1", "#ee5a24", "#0abde3",
];

interface SourceDistributionPieProps {
  data: CategoryCount[];
}

function HudTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-hud-surface/95 backdrop-blur-sm border border-hud-border rounded-md p-2 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
        <span className="font-mono text-[9px] text-hud-text">
          {payload[0].name}: <span className="text-hud-accent">{payload[0].value}</span>
        </span>
      </div>
    </div>
  );
}

export function SourceDistributionPie({ data }: SourceDistributionPieProps) {
  const t = useTranslations("analytics");

  const pieData = data.slice(0, 10).map((d, i) => ({
    name: d.category,
    value: d.count,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-4">
      <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
        ◆ {t("categoryBreakdown")} — Distribution
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {pieData.map((entry, idx) => (
              <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} fillOpacity={0.8} />
            ))}
          </Pie>
          <Tooltip content={<HudTooltip />} />
          <Legend
            iconType="circle"
            iconSize={6}
            formatter={(value) => <span className="font-mono text-[8px] text-hud-muted uppercase">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
