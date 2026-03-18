"use client";

import { useTranslations } from "next-intl";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { CategoryCount } from "@/hooks/useAnalytics";

const CATEGORY_COLORS: Record<string, string> = {
  conflict: "#ff4757",
  finance: "#ffd000",
  cyber: "#00e5ff",
  tech: "#8a5cf6",
  natural: "#00ff88",
  aviation: "#c471ed",
  energy: "#ff9f43",
  diplomacy: "#1dd1a1",
  protest: "#ee5a24",
  health: "#0abde3",
};

interface CategoryBreakdownChartProps {
  data: CategoryCount[];
}

function HudTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryCount }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-hud-surface/95 backdrop-blur-sm border border-hud-border rounded-md p-2 shadow-lg">
      <span className="font-mono text-[9px] text-hud-text">{d.icon} {d.category}: <span className="text-hud-accent">{d.count}</span></span>
    </div>
  );
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const t = useTranslations("analytics");

  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-4">
      <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
        ◆ {t("categoryBreakdown")}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2a4a" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#5a7a9a", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={{ stroke: "#1a2a4a" }}
            tickLine={false}
          />
          <YAxis
            dataKey="category"
            type="category"
            width={70}
            tick={{ fill: "#5a7a9a", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val: string) => val.toUpperCase()}
          />
          <Tooltip content={<HudTooltip />} cursor={{ fill: "#1a2a4a40" }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={16}>
            {data.map((entry) => (
              <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || "#00e5ff"} fillOpacity={0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
