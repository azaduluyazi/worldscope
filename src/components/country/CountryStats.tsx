"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelItem, Severity, Category } from "@/types/intel";
import { computeCountryThreat } from "@/lib/utils/country-helpers";

interface CountryStatsProps {
  allItems: IntelItem[];
}

export function CountryStats({ allItems }: CountryStatsProps) {
  const t = useTranslations("country");

  const stats = useMemo(() => {
    const sevCounts: Record<string, number> = {};
    const catCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    let geoCount = 0;

    allItems.forEach((e) => {
      sevCounts[e.severity] = (sevCounts[e.severity] || 0) + 1;
      catCounts[e.category] = (catCounts[e.category] || 0) + 1;
      sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1;
      if (e.lat != null && e.lng != null) geoCount++;
    });

    const topCategories = Object.entries(catCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    const threatScore = computeCountryThreat(allItems);

    return { sevCounts, topCategories, threatScore, geoCount, sourceCount: Object.keys(sourceCounts).length };
  }, [allItems]);

  const threatColor =
    stats.threatScore >= 70 ? "#ff4757" :
    stats.threatScore >= 40 ? "#ffd000" :
    stats.threatScore >= 20 ? "#00e5ff" : "#00ff88";

  return (
    <div className="space-y-3">
      {/* Threat Score */}
      <div className="bg-hud-surface border border-hud-border rounded-md p-4 text-center">
        <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-2">
          ◆ {t("threatScore")}
        </div>
        <div
          className="font-mono text-[32px] font-bold"
          style={{ color: threatColor, textShadow: `0 0 20px ${threatColor}40` }}
        >
          {stats.threatScore}
        </div>
        <div className="font-mono text-[8px] text-hud-muted mt-1">/100</div>
      </div>

      {/* Severity Distribution */}
      <div className="bg-hud-surface border border-hud-border rounded-md p-4">
        <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
          ◆ {t("threatLevel")}
        </div>
        {(["critical", "high", "medium", "low", "info"] as Severity[]).map((sev) => {
          const count = stats.sevCounts[sev] || 0;
          const pct = allItems.length > 0 ? (count / allItems.length) * 100 : 0;
          return (
            <div key={sev} className="flex items-center gap-2 mb-1.5">
              <span
                className="font-mono text-[8px] w-14 text-right uppercase"
                style={{ color: SEVERITY_COLORS[sev] }}
              >
                {sev}
              </span>
              <div className="flex-1 h-2 bg-hud-panel rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: SEVERITY_COLORS[sev],
                    boxShadow: count > 0 ? `0 0 6px ${SEVERITY_COLORS[sev]}60` : "none",
                  }}
                />
              </div>
              <span className="font-mono text-[8px] text-hud-muted w-6 text-right">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Top Categories */}
      <div className="bg-hud-surface border border-hud-border rounded-md p-4">
        <div className="font-mono text-[9px] font-bold text-hud-accent tracking-wider mb-3">
          ◆ {t("topCategories")}
        </div>
        {stats.topCategories.map(([cat, count]) => (
          <div key={cat} className="flex items-center justify-between py-1 border-b border-hud-border last:border-0">
            <span className="font-mono text-[9px] text-hud-text">
              {CATEGORY_ICONS[cat as Category] || "📌"} {cat}
            </span>
            <span className="font-mono text-[9px] text-hud-muted">{count}</span>
          </div>
        ))}
        {stats.topCategories.length === 0 && (
          <p className="text-[9px] text-hud-muted">—</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-hud-surface border border-hud-border rounded-md p-2 text-center">
          <div className="font-mono text-[14px] text-severity-critical font-bold">
            {stats.sevCounts["critical"] || 0}
          </div>
          <div className="font-mono text-[7px] text-hud-muted uppercase">{t("criticalAlerts")}</div>
        </div>
        <div className="bg-hud-surface border border-hud-border rounded-md p-2 text-center">
          <div className="font-mono text-[14px] text-severity-high font-bold">
            {stats.sevCounts["high"] || 0}
          </div>
          <div className="font-mono text-[7px] text-hud-muted uppercase">{t("highAlerts")}</div>
        </div>
        <div className="bg-hud-surface border border-hud-border rounded-md p-2 text-center">
          <div className="font-mono text-[14px] text-severity-low font-bold">
            {stats.geoCount}
          </div>
          <div className="font-mono text-[7px] text-hud-muted uppercase">{t("geoLocated")}</div>
        </div>
        <div className="bg-hud-surface border border-hud-border rounded-md p-2 text-center">
          <div className="font-mono text-[14px] text-hud-accent font-bold">
            {stats.sourceCount}
          </div>
          <div className="font-mono text-[7px] text-hud-muted uppercase">{t("activeSources")}</div>
        </div>
      </div>
    </div>
  );
}
