"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { IntelCard } from "./IntelCard";
import { AIBrief } from "./AIBrief";
import { NewsPreviewModal } from "./NewsPreviewModal";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import type { IntelItem } from "@/types/intel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getVariantCategories, type VariantId } from "@/config/variants";

type TabId = "feed" | "analysis" | "brief";
const TAB_IDS: TabId[] = ["feed", "analysis", "brief"];
const PAGE_SIZE = 30;

interface IntelFeedProps {
  variant?: VariantId;
}

export function IntelFeed({ variant = "world" }: IntelFeedProps) {
  const t = useTranslations();
  const { items: allItems, isLoading, total: rawTotal } = useIntelFeed();
  const TAB_LABELS: Record<TabId, string> = {
    feed: t("intel.title"),
    analysis: t("intel.analysis"),
    brief: t("intel.aiBrief"),
  };

  // Filter items by variant categories
  const { items, total } = useMemo(() => {
    if (variant === "world") return { items: allItems, total: rawTotal };
    const { all } = getVariantCategories(variant);
    const filtered = allItems.filter((item) => all.has(item.category as never));
    return { items: filtered, total: filtered.length };
  }, [allItems, rawTotal, variant]);

  const [activeTab, setActiveTab] = useState<TabId>("feed");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [previewItem, setPreviewItem] = useState<IntelItem | null>(null);

  // Reset visible count when items change significantly
  useEffect(() => {
    if (visibleCount > items.length && items.length > 0) {
      const timer = setTimeout(() => {
        setVisibleCount(Math.min(PAGE_SIZE, items.length));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [items.length, visibleCount]);

  // ── Infinite scroll: IntersectionObserver on sentinel ──
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length));
  }, [items.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );

  // Compute analysis data (memoized, only recalcs when items change)
  const analysis = useMemo(() => {
    const categoryCount: Record<string, number> = {};
    const severityCount: Record<string, number> = {};
    const sourceCount: Record<string, number> = {};
    let geoCount = 0;

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
        {TAB_IDS.map((tabId) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={`flex-1 py-2.5 text-center font-mono text-[9px] tracking-wider transition-colors
              ${
                activeTab === tabId
                  ? "text-hud-accent border-b-2 border-hud-accent"
                  : "text-hud-muted hover:text-hud-text"
              }`}
          >
            {TAB_LABELS[tabId]}
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="font-mono text-[10px] text-hud-accent animate-blink">
              ◆ {t("app.loading")}
            </span>
          </div>
        ) : activeTab === "feed" ? (
          <div className="p-2 flex flex-col gap-1">
            {visibleItems.map((item) => (
              <IntelCard key={item.id} item={item} onPreview={setPreviewItem} />
            ))}
            {/* Infinite scroll sentinel */}
            {visibleCount < items.length && (
              <div ref={sentinelRef} className="py-3 text-center">
                <span className="font-mono text-[8px] text-hud-muted animate-pulse">
                  ◆ {t("app.loadingMore")}
                </span>
              </div>
            )}
            {visibleCount >= items.length && items.length > PAGE_SIZE && (
              <div className="py-2 text-center">
                <span className="font-mono text-[7px] text-hud-muted/50">
                  — {t("app.allEventsLoaded", { count: items.length })} —
                </span>
              </div>
            )}
          </div>
        ) : activeTab === "brief" ? (
          <AIBrief />
        ) : (
          /* Analysis Tab */
          <div className="p-3 flex flex-col gap-4">
            {/* ── Timeline Heatmap ── */}
            <div>
              <div className="hud-label text-[8px] mb-2">◆ {t("analysis.timeline")}</div>
              <div className="flex items-end gap-[3px] h-16">
                {analysis.timelineBuckets.map((count, i) => {
                  const height = Math.max(2, (count / analysis.maxBucket) * 100);
                  const severity = analysis.timelineSevBuckets[i];
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
                <span className="font-mono text-[6px] text-hud-muted">{t("analysis.hoursAgo", { hours: 24 })}</span>
                <span className="font-mono text-[6px] text-hud-muted">{t("analysis.now")}</span>
              </div>
            </div>

            {/* ── Severity Distribution ── */}
            <div>
              <div className="hud-label text-[8px] mb-2">◆ {t("analysis.severity")}</div>
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
              <div className="hud-label text-[8px] mb-2">◆ {t("analysis.category")}</div>
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
              <div className="hud-label text-[8px] mb-2">◆ {t("analysis.topSources")}</div>
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
                  {t("analysis.activeSources")}
                </div>
              </div>
              <div className="bg-hud-base/50 border border-hud-border rounded-md p-2 text-center">
                <div className="font-mono text-[16px] text-severity-low font-bold">
                  {analysis.geoCount}
                </div>
                <div className="font-mono text-[7px] text-hud-muted uppercase">
                  {t("analysis.geoLocated")}
                </div>
              </div>
              <div className="bg-hud-base/50 border border-hud-border rounded-md p-2 text-center">
                <div className="font-mono text-[16px] text-severity-critical font-bold">
                  {analysis.severityCount["critical"] || 0}
                </div>
                <div className="font-mono text-[7px] text-hud-muted uppercase">
                  {t("analysis.criticalEvents")}
                </div>
              </div>
              <div className="bg-hud-base/50 border border-hud-border rounded-md p-2 text-center">
                <div className="font-mono text-[16px] text-severity-high font-bold">
                  {analysis.severityCount["high"] || 0}
                </div>
                <div className="font-mono text-[7px] text-hud-muted uppercase">
                  {t("analysis.highAlerts")}
                </div>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-hud-border flex justify-between items-center">
        <span className="font-mono text-[8px] text-hud-muted">
          {t("intel.eventsCount", { visible: visibleCount, total })}
        </span>
        <span className="font-mono text-[8px] text-severity-low animate-blink">
          ● {t("intel.streaming")}
        </span>
      </div>

      {/* News Preview Modal */}
      <NewsPreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  );
}
