"use client";

import { useTranslations } from "next-intl";
import { CATEGORY_ICONS } from "@/types/intel";
import type { Category } from "@/types/intel";
import type { TrendData } from "@/lib/utils/trend-detection";

interface TrendIndicatorsProps {
  trends: TrendData;
}

export function TrendIndicators({ trends }: TrendIndicatorsProps) {
  const t = useTranslations("analytics");

  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-4">
      <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
        ◆ {t("trendIndicators")}
      </div>

      {/* Rising Categories */}
      {trends.risingCategories.length > 0 && (
        <div className="mb-3">
          <div className="font-mono text-[8px] text-severity-high tracking-wider mb-1.5">
            ▲ {t("rising")}
          </div>
          <div className="flex flex-wrap gap-1">
            {trends.risingCategories.map((entry) => (
              <span
                key={entry.category}
                className="font-mono text-[8px] px-1.5 py-0.5 rounded border border-severity-high/30 bg-severity-high/10 text-severity-high"
              >
                {CATEGORY_ICONS[entry.category as Category] || "📌"} {entry.category} +{Math.round(entry.changePct)}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Severity Escalation */}
      {trends.severityEscalation.escalating && (
        <div className="mb-3">
          <div className="font-mono text-[8px] text-severity-critical tracking-wider mb-1">
            ⚠ SEVERITY ESCALATION
          </div>
          <p className="font-mono text-[8px] text-hud-muted">
            Critical/High: {trends.severityEscalation.previousCriticalPct}% → {trends.severityEscalation.currentCriticalPct}%
          </p>
        </div>
      )}

      {/* Hot Regions */}
      {trends.hotRegions.length > 0 && (
        <div className="mb-3">
          <div className="font-mono text-[8px] text-hud-accent tracking-wider mb-1.5">
            ◆ HOT REGIONS
          </div>
          <div className="flex flex-wrap gap-1">
            {trends.hotRegions.map((region) => (
              <span
                key={region.label}
                className="font-mono text-[7px] px-1.5 py-0.5 rounded border border-hud-accent/30 bg-hud-accent/10 text-hud-accent"
              >
                {region.label} ({region.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* New Sources */}
      {trends.newSources.length > 0 && (
        <div>
          <div className="font-mono text-[8px] text-severity-low tracking-wider mb-1.5">
            + NEW SOURCES
          </div>
          <div className="flex flex-wrap gap-1">
            {trends.newSources.slice(0, 5).map((src) => (
              <span
                key={src}
                className="font-mono text-[7px] px-1.5 py-0.5 rounded border border-severity-low/30 bg-severity-low/10 text-severity-low"
              >
                {src}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No trends */}
      {trends.risingCategories.length === 0 && !trends.severityEscalation.escalating && trends.hotRegions.length === 0 && (
        <div className="text-center py-4">
          <span className="font-mono text-[9px] text-hud-muted">{t("stable")}</span>
        </div>
      )}
    </div>
  );
}
