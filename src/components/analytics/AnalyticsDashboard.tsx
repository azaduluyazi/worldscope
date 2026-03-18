"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAnalytics, type TimeRange } from "@/hooks/useAnalytics";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { SeverityTrendChart } from "./SeverityTrendChart";
import { CategoryBreakdownChart } from "./CategoryBreakdownChart";
import { TopSourcesChart } from "./TopSourcesChart";
import { TrendIndicators } from "./TrendIndicators";
import { GeoHotspots } from "./GeoHotspots";
import { ExportPanel } from "./ExportPanel";
import Link from "next/link";

export function AnalyticsDashboard() {
  const t = useTranslations("analytics");
  const [hours, setHours] = useState<TimeRange>(24);
  const analytics = useAnalytics(hours);

  return (
    <div className="min-h-screen bg-hud-base text-hud-text">
      {/* Header */}
      <header className="border-b border-hud-border bg-hud-surface">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-[9px] font-mono text-hud-muted mb-3">
            <Link href="/" className="text-hud-accent hover:underline">WORLDSCOPE</Link>
            <span>/</span>
            <span className="text-hud-text">ANALYTICS</span>
          </nav>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-mono text-xl font-bold text-hud-text tracking-wide">
                {t("title")}
              </h1>
              <p className="font-mono text-[10px] text-hud-muted mt-0.5">
                {t("subtitle")}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <TimeRangeSelector value={hours} onChange={setHours} />
              {analytics.isLoading && (
                <span className="font-mono text-[9px] text-hud-accent animate-pulse">◆ LOADING...</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard label={t("totalEvents")} value={analytics.totalEvents} color="#00e5ff" />
          <StatCard label={t("sources")} value={analytics.uniqueSources} color="#00ff88" />
          <StatCard label={t("regions")} value={analytics.uniqueRegions} color="#8a5cf6" />
          <StatCard label={t("avgPerHour")} value={analytics.avgPerHour} color="#ffd000" />
          <StatCard label={t("geoRate")} value={`${analytics.geoRate}%`} color="#00e5ff" />
          <StatCard label={t("categories")} value={analytics.categoryCounts.length} color="#ff9f43" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left column: Charts */}
          <div className="lg:col-span-8 space-y-4">
            <SeverityTrendChart data={analytics.severityBuckets} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CategoryBreakdownChart data={analytics.categoryCounts} />
              <TopSourcesChart data={analytics.topSources} />
            </div>
          </div>

          {/* Right column: Trends + Geo + Export */}
          <div className="lg:col-span-4 space-y-4">
            <TrendIndicators trends={analytics.trends} />
            <GeoHotspots data={analytics.geoHotspots} />
            <ExportPanel items={analytics.items} hours={hours} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hud-border bg-hud-surface mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <Link href="/" className="font-mono text-[9px] text-hud-accent hover:underline">
            ← {t("backToDashboard")}
          </Link>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-hud-surface border border-hud-border rounded-md p-3 text-center">
      <div className="font-mono text-[20px] font-bold" style={{ color, textShadow: `0 0 12px ${color}30` }}>
        {value}
      </div>
      <div className="font-mono text-[7px] text-hud-muted uppercase mt-1">{label}</div>
    </div>
  );
}
