"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import { TopBar } from "./TopBar";
import { IconSidebar } from "./IconSidebar";
import { TacticalMap } from "./TacticalMap";
import { MarketTicker } from "./MarketTicker";
import { IntelFeed } from "./IntelFeed";
import { BreakingAlerts } from "./BreakingAlerts";
import { LiveEvents } from "./LiveEvents";
import { TrendingPanel } from "./TrendingPanel";
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

        {/* Center Content — 2×2 Grid */}
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1.5 p-1.5 overflow-hidden">
          {/* Top-left: Compact Map */}
          <div className="relative overflow-hidden rounded-lg border border-hud-border">
            <ErrorBoundary section="map" fallback={<MapSkeleton />}>
              <Suspense fallback={<MapSkeleton />}>
                <TacticalMap filters={filters} />
              </Suspense>
            </ErrorBoundary>
            <ErrorBoundary section="ticker">
              <MarketTicker />
            </ErrorBoundary>
          </div>

          {/* Top-right: Breaking Alerts */}
          <ErrorBoundary section="alerts">
            <BreakingAlerts />
          </ErrorBoundary>

          {/* Bottom-left: Live Event Stream */}
          <ErrorBoundary section="live-events">
            <LiveEvents />
          </ErrorBoundary>

          {/* Bottom-right: Trending & Market Overview */}
          <ErrorBoundary section="trending">
            <TrendingPanel />
          </ErrorBoundary>
        </div>

        {/* Right Panel — Intel Feed */}
        <div className="hidden lg:block w-[340px]">
          <ErrorBoundary section="feed" fallback={<IntelFeedSkeleton />}>
            <Suspense fallback={<IntelFeedSkeleton />}>
              <IntelFeed variant={variant} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
