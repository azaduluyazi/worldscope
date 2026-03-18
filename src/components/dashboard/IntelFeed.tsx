"use client";

import { useState, useMemo } from "react";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { IntelCard } from "./IntelCard";
import { AIBrief } from "./AIBrief";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getVariantCategories, type VariantId } from "@/config/variants";

const TABS = ["INTEL FEED", "ANALYSIS", "AI BRIEF"] as const;

interface IntelFeedProps {
  variant?: VariantId;
}

export function IntelFeed({ variant = "world" }: IntelFeedProps) {
  const { items: allItems, isLoading, total: rawTotal } = useIntelFeed();

  // Filter items by variant categories
  const { items, total } = useMemo(() => {
    if (variant === "world") return { items: allItems, total: rawTotal };
    const { all } = getVariantCategories(variant);
    const filtered = allItems.filter((item) => all.has(item.category as never));
    return { items: filtered, total: filtered.length };
  }, [allItems, rawTotal, variant]);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("INTEL FEED");

  // Compute analysis data
  const analysis = useMemo(() => {
    const categoryCount: Record<string, number> = {};
    const severityCount: Record<string, number> = {};
    const sourceCount: Record<string, number> = {};
    let geoCount = 0;

    // Timeline: 12 buckets of 2 hours each (last 24h)
    const now = Date.now();
    const timelineBuckets = Array.from({ length: 12 }, () => 0);
    const timelineSevBuckets = Array.from({ length: 12 }, () => ({
      critical: 0, high: 0, medium: 0, low: 0, info: 0,
    }));

    items.forEach((item) => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      severityCount[item.severity] = (severityCount[item.severity] || 0) + 1;
      sourceCount[item.source] = (sourceCount[item.source] || 0) + 1;
      if (item.lat != null && item.lng != null) geoCount++;

      const ageMs = now - new Date(item.publishedAt).getTime();
      const bucketIdx = Math.min(11, Math.max(0, Math.floor(ageMs / (2 * 60 * 60 * 1000))));
      timelineBuckets[bucketIdx]++;
      timelineSevBuckets[bucketIdx][item.severity]++;
    });

    const topSources = Object.entries(sourceCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

    const maxBucket = Math.max(1, ...timelineBuckets);

    return {
      categoryCount, severityCount, sourceCount, geoCount,
      timelineBuckets, timelineSevBuckets, topSources, maxBucket,
    };
  }, [items]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-hud-panel to-hud-surface border-l border-hud-border">
      {/* Tabs */}
      <div className="flex border-b border-hud-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-center font-mono text-[9px] tracking-wider transition-colors
              ${
                activeTab === tab
                  ? "text-hud-accent border-b-2 border-hud-accent"
                  : "text-hud-muted hover:text-hud-text"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="font-mono text-[10px] text-hud-accent animate-blink">
              ◆ LOADING INTEL STREAM...
            </span>
          </div>
        ) : activeTab === "INTEL FEED" ? (
          <div className="p-2 flex flex-col gap-1">
            {items.slice(0, 50).map((item) => (
              <IntelCard key={item.id} item={item} />
            ))}
          </div>
        ) : activeTab === "AI BRIEF" ? (
          <AIBrief />
        ) : (
          /* Analysis Tab */
          <div className="p-3 flex flex-col gap-4">
            {/* ── Timeline Heatmap ── */}
            <div>
              <div className="hud-label text-[8px] mb-2">◆ 24H EVENT TIMELINE</div>
              <div className="flex items-end gap-[3px] h-16">
                {analysis.timelineBuckets.map((count, i) => {
                  const height = Math.max(2, (count / analysis.maxBucket) * 100);
                  const severity = analysis.timelineSevBuckets[i];
                  // Color based on dominant severity in this bucket
                  const color =
                    severity.critical > 0 ? "#ff4757" :
                    severity.high > 0 ? "#ffd000" :
                    severity.medium > 0 ? "#00e5ff" : "#00ff88";
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm transition-all duration-500 relative group"
                      style={{
                        height: `${height}%`,
                        backgroundColor: `${color}80`,
                        border: `1px solid ${color}40`,
                        minHeight: 2,
                      }}
                      title={`${(11 - i) * 2}-${(11 - i) * 2 + 2}h ago: ${count} events`}
                    >
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-[6px] text-hud-muted opacity-0 group-hover:opacity-100 whitespace-nowrap">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-mono text-[6px] text-hud-muted">24h ago</span>
                <span className="font-mono text-[6px] text-hud-muted">now</span>
              </div>
            </div>

            {/* ── Severity Distribution ── */}
            <div>
              <div className="hud-label text-[8px] mb-2">◆ SEVERITY DISTRIBUTION</div>
              {(["critical", "high", "medium", "low", "info"] as const).map((sev) => {
                const count = analysis.severityCount[sev] || 0;
                const color = SEVERITY_COLORS[sev];
                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
                return (
                  <div key={sev} className="flex items-center gap-2 mb-1">
                    <span
                      className="w-14 font-mono text-[8px] uppercase"
                      style={{ color }}
                    >
                      {sev}
                    </span>
                    <div className="flex-1 h-2 bg-hud-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${total > 0 ? (count / total) * 100 : 0}%`,
                          backgroundColor: color,
                          boxShadow: count > 0 ? `0 0 6px ${color}60` : "none",
                        }}
                      />
                    </div>
                    <span className="font-mono text-[8px] text-hud-text w-12 text-right">
                      {count} <span className="text-hud-muted">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ── Category Breakdown ── */}
            <div>
              <div className="hud-label text-[8px] mb-2">◆ CATEGORY BREAKDOWN</div>
              {Object.entries(analysis.categoryCount)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => {
                  const icon = CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] || "📄";
                  return (
                    <div key={cat} className="flex items-center gap-2 mb-1">
                      <span className="w-20 font-mono text-[8px] text-hud-muted uppercase flex items-center gap-1">
                        <span className="text-[9px]">{icon}</span> {cat}
                      </span>
                      <div className="flex-1 h-1.5 bg-hud-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-hud-accent/70 transition-all duration-500"
                          style={{ width: `${(count / total) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[8px] text-hud-text w-6 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* ── Top Sources ── */}
            <div>
              <div className="hud-label text-[8px] mb-2">◆ TOP SOURCES</div>
              {analysis.topSources.map(([source, count], idx) => (
                <div key={source} className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[7px] text-hud-muted w-3 text-right">
                    {idx + 1}.
                  </span>
                  <span className="font-mono text-[8px] text-hud-text flex-1 truncate">
                    {source}
                  </span>
                  <span className="font-mono text-[8px] text-hud-accent">
                    {count}
                  </span>
                </div>
              ))}
            </div>

            {/* ── Quick Stats ── */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-hud-base/50 border border-hud-border rounded-md p-2 text-center">
                <div className="font-mono text-[16px] text-hud-accent font-bold">
                  {Object.keys(analysis.sourceCount).length}
                </div>
                <div className="font-mono text-[7px] text-hud-muted uppercase">
                  Active Sources
                </div>
              </div>
              <div className="bg-hud-base/50 border border-hud-border rounded-md p-2 text-center">
                <div className="font-mono text-[16px] text-severity-low font-bold">
                  {analysis.geoCount}
                </div>
                <div className="font-mono text-[7px] text-hud-muted uppercase">
                  Geo-Located
                </div>
              </div>
              <div className="bg-hud-base/50 border border-hud-border rounded-md p-2 text-center">
                <div className="font-mono text-[16px] text-severity-critical font-bold">
                  {analysis.severityCount["critical"] || 0}
                </div>
                <div className="font-mono text-[7px] text-hud-muted uppercase">
                  Critical Events
                </div>
              </div>
              <div className="bg-hud-base/50 border border-hud-border rounded-md p-2 text-center">
                <div className="font-mono text-[16px] text-severity-high font-bold">
                  {analysis.severityCount["high"] || 0}
                </div>
                <div className="font-mono text-[7px] text-hud-muted uppercase">
                  High Alerts
                </div>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-hud-border flex justify-between items-center">
        <span className="font-mono text-[8px] text-hud-muted">
          {total} events tracked
        </span>
        <span className="font-mono text-[8px] text-severity-low animate-blink">
          ● STREAMING
        </span>
      </div>
    </div>
  );
}
