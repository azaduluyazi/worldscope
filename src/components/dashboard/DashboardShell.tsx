"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import { TopBar } from "./TopBar";
import { IconSidebar } from "./IconSidebar";
import { TacticalMap } from "./TacticalMap";
import { MarketTicker } from "./MarketTicker";
import { IntelFeed } from "./IntelFeed";
import { BreakingAlerts } from "./BreakingAlerts";
import { LiveBroadcasts } from "./LiveBroadcasts";
import { LiveWebcams } from "./LiveWebcams";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { MapSkeleton, IntelFeedSkeleton } from "@/components/shared/Skeleton";
import { useKeyboardShortcuts, CATEGORY_KEYS } from "@/hooks/useKeyboardShortcuts";
import { VARIANTS, type VariantId } from "@/config/variants";
import type { MapFilters } from "@/types/geo";

const DEFAULT_FILTERS: MapFilters = {
  categories: new Set<string>(),
  severities: new Set<string>(),
  heatmap: false,
  clusters: true,
};

interface DashboardShellProps {
  variant?: VariantId;
}

export function DashboardShell({ variant = "world" }: DashboardShellProps) {
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const variantConfig = VARIANTS[variant];

  const toggleCategory = useCallback((cat: string) => {
    setFilters((prev) => {
      const next = new Set(prev.categories);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return { ...prev, categories: next };
    });
  }, []);

  const toggleHeatmap = useCallback(() => {
    setFilters((prev) => ({ ...prev, heatmap: !prev.heatmap }));
  }, []);

  const toggleClusters = useCallback(() => {
    setFilters((prev) => ({ ...prev, clusters: !prev.clusters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Keyboard shortcuts: 1-9 toggle categories, H=heatmap, C=clusters, Esc=clear
  const shortcuts = useMemo(
    () => ({
      ...Object.fromEntries(
        Object.entries(CATEGORY_KEYS).map(([key, cat]) => [key, () => toggleCategory(cat)])
      ),
      h: toggleHeatmap,
      c: toggleClusters,
      escape: clearFilters,
    }),
    [toggleCategory, toggleHeatmap, toggleClusters, clearFilters]
  );
  useKeyboardShortcuts(shortcuts);

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ "--variant-accent": variantConfig.accent } as React.CSSProperties}
    >
      <TopBar variant={variant} />

      <div className="flex-1 flex overflow-hidden">
        {/* Icon Sidebar — filter controls */}
        <IconSidebar
          variant={variant}
          filters={filters}
          onToggleCategory={toggleCategory}
          onToggleHeatmap={toggleHeatmap}
          onToggleClusters={toggleClusters}
        />

        {/* ═══ Layout C: 3 Column Balanced ═══ */}
        <div className="flex-1 flex gap-1 p-1 overflow-hidden">

          {/* ── Column 1: Map + Webcams ── */}
          <div className="flex-[3.5] flex flex-col gap-1 min-w-0">
            {/* Tactical Map */}
            <div className="flex-[5.5] relative overflow-hidden rounded-lg border border-hud-border min-h-0">
              <ErrorBoundary section="map" fallback={<MapSkeleton />}>
                <Suspense fallback={<MapSkeleton />}>
                  <TacticalMap filters={filters} />
                </Suspense>
              </ErrorBoundary>
              <ErrorBoundary section="ticker">
                <MarketTicker />
              </ErrorBoundary>
            </div>

            {/* Live Webcams */}
            <div className="flex-[4.5] min-h-0">
              <ErrorBoundary section="webcams">
                <LiveWebcams />
              </ErrorBoundary>
            </div>
          </div>

          {/* ── Column 2: Live TV + Breaking ── */}
          <div className="flex-[3.5] flex flex-col gap-1 min-w-0">
            {/* Live Broadcasts */}
            <div className="flex-[5] min-h-0">
              <ErrorBoundary section="broadcasts">
                <LiveBroadcasts />
              </ErrorBoundary>
            </div>

            {/* Breaking Alerts */}
            <div className="flex-[5] min-h-0">
              <ErrorBoundary section="alerts">
                <BreakingAlerts />
              </ErrorBoundary>
            </div>
          </div>

          {/* ── Column 3: Intel Feed ── */}
          <div className="flex-[3] min-w-0 hidden lg:block">
            <ErrorBoundary section="feed" fallback={<IntelFeedSkeleton />}>
              <Suspense fallback={<IntelFeedSkeleton />}>
                <IntelFeed variant={variant} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
