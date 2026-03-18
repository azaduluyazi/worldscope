"use client";

import { useTranslations } from "next-intl";
import type { SourceCount } from "@/hooks/useAnalytics";

interface TopSourcesChartProps {
  data: SourceCount[];
}

export function TopSourcesChart({ data }: TopSourcesChartProps) {
  const t = useTranslations("analytics");
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-4">
      <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
        ◆ {t("topSources")}
      </div>
      <div className="space-y-1.5">
        {data.map((source, idx) => (
          <div key={source.source} className="flex items-center gap-2">
            <span className="font-mono text-[7px] text-hud-muted w-4 text-right shrink-0">
              {idx + 1}.
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-mono text-[8px] text-hud-text truncate">{source.source}</span>
                <span className="font-mono text-[8px] text-hud-accent shrink-0 ml-2">{source.count}</span>
              </div>
              <div className="h-1 bg-hud-panel rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-hud-accent/60 transition-all duration-500"
                  style={{ width: `${(source.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className="font-mono text-[8px] text-hud-muted text-center py-4">{t("noData")}</p>
        )}
      </div>
    </div>
  );
}
