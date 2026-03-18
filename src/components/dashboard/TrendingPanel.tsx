"use client";

import { useMemo } from "react";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { useMarketData } from "@/hooks/useMarketData";
import { CATEGORY_ICONS, type Category } from "@/types/intel";
import { getDirection } from "@/types/market";

/** Trending categories, hot regions, and market overview */
export function TrendingPanel() {
  const { items } = useIntelFeed();
  const { quotes, fearGreed } = useMarketData();

  const stats = useMemo(() => {
    const categoryCount: Record<string, number> = {};
    const regionCount: Record<string, number> = {};
    let criticalCount = 0;
    let geoCount = 0;

    items.forEach((item) => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      if (item.severity === "critical") criticalCount++;
      if (item.lat != null) geoCount++;
      if (item.countryCode) {
        regionCount[item.countryCode] =
          (regionCount[item.countryCode] || 0) + 1;
      }
    });

    const topCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    const topRegions = Object.entries(regionCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const maxCatCount = topCategories[0]?.[1] || 1;

    return { topCategories, topRegions, criticalCount, geoCount, maxCatCount, total: items.length };
  }, [items]);

  return (
    <div className="h-full flex flex-col bg-hud-surface/50 border border-hud-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-hud-border">
        <span className="hud-label text-[9px]">◆ SITUATION OVERVIEW</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-1.5">
          <StatCard label="EVENTS" value={stats.total} color="#00e5ff" />
          <StatCard label="CRITICAL" value={stats.criticalCount} color="#ff4757" />
          <StatCard label="GEO-PIN" value={stats.geoCount} color="#00ff88" />
        </div>

        {/* Category bars */}
        <div>
          <div className="hud-label text-[8px] mb-1.5">TRENDING CATEGORIES</div>
          {stats.topCategories.map(([cat, count]) => {
            const icon = CATEGORY_ICONS[cat as Category] || "📄";
            const pct = (count / stats.maxCatCount) * 100;
            return (
              <div key={cat} className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] w-4">{icon}</span>
                <span className="font-mono text-[8px] text-hud-muted w-14 uppercase truncate">
                  {cat}
                </span>
                <div className="flex-1 h-1.5 bg-hud-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: "#00e5ff",
                    }}
                  />
                </div>
                <span className="font-mono text-[8px] text-hud-text w-6 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hot regions */}
        {stats.topRegions.length > 0 && (
          <div>
            <div className="hud-label text-[8px] mb-1.5">HOT REGIONS</div>
            <div className="flex flex-wrap gap-1">
              {stats.topRegions.map(([code, count]) => (
                <span
                  key={code}
                  className="font-mono text-[8px] bg-hud-panel border border-hud-border rounded px-1.5 py-0.5 text-hud-text"
                >
                  {code}{" "}
                  <span className="text-hud-accent">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Market Quick */}
        <div>
          <div className="hud-label text-[8px] mb-1.5">MARKET PULSE</div>
          <div className="grid grid-cols-2 gap-1">
            {quotes.slice(0, 4).map((q) => {
              const dir = getDirection(q.changePct);
              const color =
                dir === "up" ? "#00ff88" : dir === "down" ? "#ff4757" : "#5a7a9a";
              const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "─";
              return (
                <div
                  key={q.symbol}
                  className="bg-hud-panel/50 border border-hud-border rounded px-2 py-1.5"
                >
                  <div className="font-mono text-[7px] text-hud-muted">{q.symbol}</div>
                  <div className="font-mono text-[11px] font-bold" style={{ color }}>
                    {q.price >= 1000
                      ? `${(q.price / 1000).toFixed(1)}K`
                      : q.price.toFixed(2)}
                  </div>
                  <div className="font-mono text-[7px]" style={{ color }}>
                    {arrow} {Math.abs(q.changePct).toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fear & Greed */}
        {fearGreed && (
          <div className="bg-hud-panel/50 border border-hud-border rounded px-3 py-2 text-center">
            <div className="font-mono text-[7px] text-hud-muted">FEAR & GREED</div>
            <div
              className="font-mono text-lg font-bold"
              style={{
                color:
                  fearGreed.value <= 25
                    ? "#ff4757"
                    : fearGreed.value <= 45
                    ? "#ffd000"
                    : fearGreed.value <= 55
                    ? "#5a7a9a"
                    : "#00ff88",
              }}
            >
              {fearGreed.value}
            </div>
            <div className="font-mono text-[8px] text-hud-muted">
              {fearGreed.classification}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-hud-panel/50 border border-hud-border rounded px-2 py-1.5 text-center">
      <div className="font-mono text-sm font-bold" style={{ color }}>
        {value}
      </div>
      <div className="font-mono text-[6px] text-hud-muted uppercase">{label}</div>
    </div>
  );
}
