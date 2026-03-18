"use client";

import { useState, useCallback, useMemo, memo, Suspense } from "react";
import dynamic from "next/dynamic";
import { TopBar } from "./TopBar";
import { IconSidebar } from "./IconSidebar";
import { MarketTicker } from "./MarketTicker";
import { IntelFeed } from "./IntelFeed";
import { BreakingAlerts } from "./BreakingAlerts";
import { LiveBroadcasts } from "./LiveBroadcasts";
import { LiveWebcams } from "./LiveWebcams";
import { MobileBottomNav, type MobilePanel } from "./MobileBottomNav";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { MapSkeleton, IntelFeedSkeleton } from "@/components/shared/Skeleton";
import { useKeyboardShortcuts, CATEGORY_KEYS } from "@/hooks/useKeyboardShortcuts";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { VARIANTS, type VariantId } from "@/config/variants";
import type { MapFilters } from "@/types/geo";

const PANEL_ORDER: MobilePanel[] = ["map", "feed", "live", "alerts"];

/** Dynamic import TacticalMap — 3.2MB mapbox-gl only loads when needed */
const TacticalMap = dynamic(
  () => import("./TacticalMap").then((mod) => ({ default: mod.TacticalMap })),
  { ssr: false, loading: () => <MapSkeleton /> }
);

/** Memoized child components — prevent re-renders when filters change */
const MemoLiveWebcams = memo(LiveWebcams);
const MemoLiveBroadcasts = memo(LiveBroadcasts);
const MemoBreakingAlerts = memo(BreakingAlerts);
const MemoMarketTicker = memo(MarketTicker);

const DEFAULT_FILTERS: MapFilters = {
  categories: new Set<string>(),
  severities: new Set<string>(),
  heatmap: false,
  clusters: true,
  flights: true,
  vessels: true,
  gpsJamming: true,
  cables: false,
};

interface DashboardShellProps {
  variant?: VariantId;
}

export function DashboardShell({ variant = "world" }: DashboardShellProps) {
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("map");
  const variantConfig = VARIANTS[variant];

  // Swipe left/right to cycle mobile panels
  const swipeRef = useSwipeGesture<HTMLDivElement>({
    onSwipeLeft: useCallback(() => {
      setMobilePanel((prev) => {
        const idx = PANEL_ORDER.indexOf(prev);
        return PANEL_ORDER[(idx + 1) % PANEL_ORDER.length];
      });
    }, []),
    onSwipeRight: useCallback(() => {
      setMobilePanel((prev) => {
        const idx = PANEL_ORDER.indexOf(prev);
        return PANEL_ORDER[(idx - 1 + PANEL_ORDER.length) % PANEL_ORDER.length];
      });
    }, []),
  });

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

  const toggleLayer = useCallback((layer: "flights" | "vessels" | "gpsJamming" | "cables") => {
    setFilters((prev) => ({ ...prev, [layer]: !prev[layer] }));
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
        {/* Icon Sidebar — hidden on mobile, shown on md+ */}
        <div className="hidden md:block">
          <IconSidebar
            variant={variant}
            filters={filters}
            onToggleCategory={toggleCategory}
            onToggleHeatmap={toggleHeatmap}
            onToggleClusters={toggleClusters}
            onToggleLayer={toggleLayer}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════
            MOBILE LAYOUT (<md): Full-screen panels via bottom nav
            ═══════════════════════════════════════════════════════ */}
        <div ref={swipeRef} className="flex-1 md:hidden relative overflow-hidden">
          {/* Map — always rendered but hidden when other panels active */}
          <div className={`absolute inset-0 ${mobilePanel === "map" ? "z-10" : "z-0"}`}>
            <ErrorBoundary section="map" fallback={<MapSkeleton />}>
              <TacticalMap filters={filters} variant={variant} />
            </ErrorBoundary>
            <ErrorBoundary section="ticker">
              <MemoMarketTicker />
            </ErrorBoundary>
          </div>

          {/* Intel Feed panel */}
          {mobilePanel === "feed" && (
            <div className="absolute inset-0 z-20 bg-hud-base overflow-auto pb-16 mobile-panel-enter">
              <ErrorBoundary section="feed" fallback={<IntelFeedSkeleton />}>
                <Suspense fallback={<IntelFeedSkeleton />}>
                  <IntelFeed variant={variant} />
                </Suspense>
              </ErrorBoundary>
            </div>
          )}

          {/* Live TV panel */}
          {mobilePanel === "live" && (
            <div className="absolute inset-0 z-20 bg-hud-base overflow-auto pb-16 flex flex-col gap-1 p-1 mobile-panel-enter">
              <div className="flex-1 min-h-[200px]">
                <ErrorBoundary section="broadcasts">
                  <MemoLiveBroadcasts />
                </ErrorBoundary>
              </div>
              <div className="flex-1 min-h-[200px]">
                <ErrorBoundary section="webcams">
                  <MemoLiveWebcams />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* Alerts panel */}
          {mobilePanel === "alerts" && (
            <div className="absolute inset-0 z-20 bg-hud-base overflow-auto pb-16 mobile-panel-enter">
              <ErrorBoundary section="alerts">
                <MemoBreakingAlerts />
              </ErrorBoundary>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            DESKTOP LAYOUT (md+): 3-column balanced
            ═══════════════════════════════════════════════════════ */}
        <div className="flex-1 hidden md:flex gap-1 p-1 overflow-hidden">

          {/* ── Column 1: Map + Webcams ── */}
          <div className="flex-[3.5] flex flex-col gap-1 min-w-0 col-stagger-1">
            {/* Tactical Map — lazy loaded */}
            <div className="flex-[5.5] relative overflow-hidden rounded-lg border border-hud-border min-h-0">
              <ErrorBoundary section="map" fallback={<MapSkeleton />}>
                <TacticalMap filters={filters} variant={variant} />
              </ErrorBoundary>
              <ErrorBoundary section="ticker">
                <MemoMarketTicker />
              </ErrorBoundary>
            </div>

            {/* Live Webcams */}
            <div className="flex-[4.5] min-h-0">
              <ErrorBoundary section="webcams">
                <MemoLiveWebcams />
              </ErrorBoundary>
            </div>
          </div>

          {/* ── Column 2: Live TV + Breaking ── */}
          <div className="flex-[3.5] flex flex-col gap-1 min-w-0 col-stagger-2">
            {/* Live Broadcasts */}
            <div className="flex-[5] min-h-0">
              <ErrorBoundary section="broadcasts">
                <MemoLiveBroadcasts />
              </ErrorBoundary>
            </div>

            {/* Breaking Alerts */}
            <div className="flex-[5] min-h-0">
              <ErrorBoundary section="alerts">
                <MemoBreakingAlerts />
              </ErrorBoundary>
            </div>
          </div>

          {/* ── Column 3: Intel Feed ── */}
          <div className="flex-[3] min-w-0 hidden lg:block col-stagger-3">
            <ErrorBoundary section="feed" fallback={<IntelFeedSkeleton />}>
              <Suspense fallback={<IntelFeedSkeleton />}>
                <IntelFeed variant={variant} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        variant={variant}
        activePanel={mobilePanel}
        onPanelChange={setMobilePanel}
      />
    </div>
  );
}
