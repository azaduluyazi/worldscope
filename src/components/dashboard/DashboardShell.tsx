"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import { TopBar } from "./TopBar";
import { IconSidebar } from "./IconSidebar";
import { TacticalMap } from "./TacticalMap";
import { MarketTicker } from "./MarketTicker";
import { IntelFeed } from "./IntelFeed";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { MapSkeleton, IntelFeedSkeleton } from "@/components/shared/Skeleton";
import { useKeyboardShortcuts, CATEGORY_KEYS } from "@/hooks/useKeyboardShortcuts";
import type { MapFilters } from "@/types/geo";

const DEFAULT_FILTERS: MapFilters = {
  categories: new Set<string>(),
  severities: new Set<string>(),
  heatmap: false,
  clusters: true,
};

export function DashboardShell() {
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);

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
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        {/* Icon Sidebar — filter controls */}
        <IconSidebar
          filters={filters}
          onToggleCategory={toggleCategory}
          onToggleHeatmap={toggleHeatmap}
          onToggleClusters={toggleClusters}
        />

        {/* Map Area */}
        <div className="flex-1 relative overflow-hidden">
          <ErrorBoundary section="map" fallback={<MapSkeleton />}>
            <Suspense fallback={<MapSkeleton />}>
              <TacticalMap filters={filters} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary section="ticker">
            <MarketTicker />
          </ErrorBoundary>
        </div>

        {/* Right Panel */}
        <div className="hidden lg:block w-[360px]">
          <ErrorBoundary section="feed" fallback={<IntelFeedSkeleton />}>
            <Suspense fallback={<IntelFeedSkeleton />}>
              <IntelFeed />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
