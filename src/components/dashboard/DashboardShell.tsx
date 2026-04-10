"use client";

import { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { MapSkeleton, IntelFeedSkeleton } from "@/components/shared/Skeleton";
import { TopBar } from "./TopBar";
import { MobileBottomNav, type MobilePanel } from "./MobileBottomNav";
import { BreakingToast } from "./BreakingToast";

/** Heavy components — lazy loaded to reduce initial JS bundle */
const MarketTicker = dynamic(() => import("./MarketTicker").then((m) => ({ default: m.MarketTicker })), { ssr: false });
const IntelFeed = dynamic(
  () => import("./IntelFeed").then((m) => ({ default: m.IntelFeed })),
  { ssr: false, loading: () => <IntelFeedSkeleton /> }
);
const BreakingAlerts = dynamic(() => import("./BreakingAlerts").then((m) => ({ default: m.BreakingAlerts })), { ssr: false });
const LiveBroadcasts = dynamic(() => import("./LiveBroadcasts").then((m) => ({ default: m.LiveBroadcasts })), { ssr: false });
const ConvergencePanel = dynamic(() => import("./ConvergencePanel").then((m) => ({ default: m.ConvergencePanel })), { ssr: false });
const StorylinePanel = dynamic(() => import("./StorylinePanel").then((m) => ({ default: m.StorylinePanel })), { ssr: false });
const KeyboardHelp = dynamic(() => import("./KeyboardHelp").then((m) => ({ default: m.KeyboardHelp })), { ssr: false });
const StatusFooter = dynamic(() => import("./StatusFooter").then((m) => ({ default: m.StatusFooter })), { ssr: false });
const NewsTicker = dynamic(() => import("./NewsTicker").then((m) => ({ default: m.NewsTicker })), { ssr: false });
const MapViewToggle = dynamic(
  () => import("./MapViewToggle").then((m) => ({ default: m.MapViewToggle })),
  { ssr: false }
);
import type { MapMode } from "./MapViewToggle";
const NewsletterPopup = dynamic(
  () => import("./NewsletterPopup").then((m) => ({ default: m.NewsletterPopup })),
  { ssr: false }
);
const ConnectionStatus = dynamic(
  () => import("./ConnectionStatus").then((m) => ({ default: m.ConnectionStatus })),
  { ssr: false }
);
const MapLayerPanel = dynamic(
  () => import("./MapLayerPanel").then((m) => ({ default: m.MapLayerPanel })),
  { ssr: false }
);
import { useMapLayers } from "./MapLayerPanel";

/** Lazy-loaded tab panels — only loaded when user clicks the tab */
const PredictionPanel = dynamic(
  () => import("./PredictionPanel").then((m) => ({ default: m.PredictionPanel })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center"><span className="font-mono text-[9px] text-hud-muted animate-pulse">LOADING...</span></div> }
);
const EconomicsPanel = dynamic(
  () => import("./EconomicsPanel").then((m) => ({ default: m.EconomicsPanel })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center"><span className="font-mono text-[9px] text-hud-muted animate-pulse">LOADING...</span></div> }
);
const CommandPalette = dynamic(
  () => import("./CommandPalette").then((m) => ({ default: m.CommandPalette })),
  { ssr: false }
);
const CountryRiskPanel = dynamic(
  () => import("./CountryRiskPanel").then((m) => ({ default: m.CountryRiskPanel })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center"><span className="font-mono text-[9px] text-hud-muted animate-pulse">LOADING...</span></div> }
);
const EquityResearchPanel = dynamic(
  () => import("./EquityResearchPanel").then((m) => ({ default: m.EquityResearchPanel })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center"><span className="font-mono text-[9px] text-hud-muted animate-pulse">LOADING...</span></div> }
);
const MarketComposite = dynamic(
  () => import("./MarketComposite").then((m) => ({ default: m.MarketComposite })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center"><span className="font-mono text-[9px] text-hud-muted animate-pulse">LOADING...</span></div> }
);
const GeopoliticalAnalysis = dynamic(
  () => import("./GeopoliticalAnalysis").then((m) => ({ default: m.GeopoliticalAnalysis })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center"><span className="font-mono text-[9px] text-hud-muted animate-pulse">LOADING...</span></div> }
);
const EscalationMonitor = dynamic(
  () => import("./EscalationMonitor").then((m) => ({ default: m.EscalationMonitor })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center"><span className="font-mono text-[9px] text-hud-muted animate-pulse">LOADING...</span></div> }
);
const AIStrategicBrief = dynamic(
  () => import("./AIStrategicBrief").then((m) => ({ default: m.AIStrategicBrief })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center"><span className="font-mono text-[9px] text-hud-muted animate-pulse">LOADING...</span></div> }
);
/** Theme-specific banners — only loaded when active theme needs them */
const DefconBar = dynamic(() => import("./DefconBar").then((m) => ({ default: m.DefconBar })), { ssr: false });
const NeonBreakingBanner = dynamic(() => import("./NeonBreakingBanner").then((m) => ({ default: m.NeonBreakingBanner })), { ssr: false });
const WarzoneBreakingAlert = dynamic(() => import("./WarzoneBreakingAlert").then((m) => ({ default: m.WarzoneBreakingAlert })), { ssr: false });
const SourceSelector = dynamic(
  () => import("./SourceSelector").then((m) => ({ default: m.SourceSelector })),
  { ssr: false }
);
const SortablePanels = dynamic(
  () => import("./SortablePanels").then((m) => ({ default: m.SortablePanels })),
  { ssr: false }
);
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useKeyboardShortcuts, CATEGORY_KEYS } from "@/hooks/useKeyboardShortcuts";
import { useIntelFeed } from "@/hooks/useIntelFeed";
import { useTheme } from "@/components/shared/ThemeProvider";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { VARIANTS, type VariantId } from "@/config/variants";
import type { MapFilters } from "@/types/geo";
import { loadPreferences, savePreferences } from "@/lib/user-preferences";

const PANEL_ORDER: MobilePanel[] = ["map", "feed", "live", "alerts"];

/** Dynamic import TacticalMap — 3.2MB mapbox-gl only loads when needed */
/** Dynamic import Globe3D — Three.js only loads when 3D mode is active */
const Globe3D = dynamic(
  () => import("./Globe3D").then((mod) => ({ default: mod.Globe3D })),
  { ssr: false, loading: () => <MapSkeleton /> }
);

const TacticalMap = dynamic(
  () => import("./TacticalMap").then((mod) => ({ default: mod.TacticalMap })),
  { ssr: false, loading: () => <MapSkeleton /> }
);

/* Note: memo() removed — dynamic() components already manage their own loading lifecycle */

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
  const [filters, setFilters] = useState<MapFilters>(() => {
    const prefs = loadPreferences();
    return { ...DEFAULT_FILTERS, heatmap: prefs.mapLayers.heatmap, clusters: prefs.mapLayers.clusters, categories: new Set(prefs.categoryFilters), severities: new Set() };
  });
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("map");
  const [mapMode, setMapMode] = useState<MapMode>("2d");
  const [rightTab, setRightTab] = useState<"intel" | "predictions" | "economics" | "risk" | "equity" | "geopolitics" | "escalation">("intel");
  const { layers, toggleLayer: toggleMapLayer, enabledLayerIds } = useMapLayers();
  const variantConfig = VARIANTS[variant];

  // Source filtering state (persisted in localStorage)
  const [excludedSources, setExcludedSources] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("ws-excluded-sources");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const toggleSource = useCallback((source: string) => {
    setExcludedSources((prev) => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      localStorage.setItem("ws-excluded-sources", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const clearSourceFilters = useCallback(() => {
    setExcludedSources(new Set());
    localStorage.removeItem("ws-excluded-sources");
  }, []);

  // Persist filter changes to localStorage
  useEffect(() => {
    savePreferences({
      mapLayers: {
        heatmap: filters.heatmap,
        clusters: filters.clusters,
      },
      categoryFilters: [...filters.categories],
    });
  }, [filters]);

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

  // Layer toggles now handled by useMapLayers (MapLayerPanel)

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

  // Theme-specific: get latest breaking item for banners
  const { theme } = useTheme();
  const { items: intelItems } = useIntelFeed();
  const topBreaking = useMemo(() => {
    return intelItems.find((i) => i.severity === "critical");
  }, [intelItems]);

  return (
    <div
      role="application"
      aria-label={`WorldScope ${variantConfig.name} Dashboard`}
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ "--variant-accent": variantConfig.accent } as React.CSSProperties}
    >
      {/* Theme-specific: Neon gradient breaking banner */}
      <NeonBreakingBanner text={topBreaking?.title} />
      {/* Theme-specific: Warzone flashing red alert */}
      <WarzoneBreakingAlert text={topBreaking?.title} time={topBreaking ? new Date(topBreaking.publishedAt).toUTCString().split(" ")[4] + " UTC" : undefined} />

      <TopBar variant={variant} />

      {/* Theme-specific: DEFCON threat-level bar (Warzone only) */}
      <DefconBar activeLevel={0} />

      <div className="flex-1 flex overflow-hidden">
        {/* IconSidebar removed in v3.3 — its filters (category, heatmap,
            clusters) are all accessible via keyboard shortcuts
            (1-9, H, C, Esc) and via MapLayerPanel on the map itself.
            Policy links (TOS/PRV/RFD) moved to StatusFooter. */}

        {/* ═══════════════════════════════════════════════════════
            MOBILE LAYOUT (<md): Full-screen panels via bottom nav
            ═══════════════════════════════════════════════════════ */}
        <div ref={swipeRef} className="flex-1 md:hidden relative overflow-hidden">
          {/* Map — always rendered but hidden when other panels active */}
          <div className={`absolute inset-0 ${mobilePanel === "map" ? "z-10" : "z-0"}`}>
            <ErrorBoundary section="map" fallback={<MapSkeleton />}>
              <TacticalMap filters={filters} variant={variant} enabledLayers={enabledLayerIds} />
            </ErrorBoundary>
            <ErrorBoundary section="ticker">
              <MarketTicker />
            </ErrorBoundary>
          </div>

          {/* Intel / Predictions / Economics panel (mobile) */}
          {mobilePanel === "feed" && (
            <div className="absolute inset-0 z-20 bg-hud-base overflow-y-auto pb-16 flex flex-col mobile-panel-enter">
              {/* Mobile tab bar */}
              <div className="flex border-b border-hud-border/50 shrink-0">
                {([
                  { id: "intel" as const, label: "INTEL", icon: "📡" },
                  { id: "predictions" as const, label: "PREDICT", icon: "📊" },
                  { id: "economics" as const, label: "ECON", icon: "💹" },
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRightTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 font-mono text-[8px] tracking-wider transition-all ${
                      rightTab === tab.id
                        ? "text-hud-accent border-b-2 border-hud-accent"
                        : "text-hud-muted hover:text-hud-text"
                    }`}
                  >
                    <span className="text-[10px]">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-auto">
                {rightTab === "intel" && (
                  <ErrorBoundary section="feed" fallback={<IntelFeedSkeleton />}>
                    <Suspense fallback={<IntelFeedSkeleton />}>
                      <IntelFeed variant={variant} excludedSources={excludedSources} />
                    </Suspense>
                  </ErrorBoundary>
                )}
                {rightTab === "predictions" && (
                  <ErrorBoundary section="predictions"><PredictionPanel /></ErrorBoundary>
                )}
                {rightTab === "economics" && (
                  <ErrorBoundary section="economics"><EconomicsPanel /></ErrorBoundary>
                )}
              </div>
            </div>
          )}

          {/* Live TV panel */}
          {mobilePanel === "live" && (
            <div className="absolute inset-0 z-20 bg-hud-base overflow-auto pb-16 flex flex-col gap-1 p-1 mobile-panel-enter">
              <div className="flex-1 min-h-[200px]">
                <ErrorBoundary section="broadcasts">
                  <LiveBroadcasts />
                </ErrorBoundary>
              </div>
              <div className="flex-1 min-h-[200px]">
                <ErrorBoundary section="convergence">
                  <ConvergencePanel />
                </ErrorBoundary>
              </div>
              <div className="flex-1 min-h-[200px]">
                <ErrorBoundary section="storylines">
                  <StorylinePanel />
                </ErrorBoundary>
              </div>
            </div>
          )}

          {/* Alerts panel */}
          {mobilePanel === "alerts" && (
            <div className="absolute inset-0 z-20 bg-hud-base overflow-auto pb-16 mobile-panel-enter">
              <ErrorBoundary section="alerts">
                <BreakingAlerts />
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
            {/* Map — 2D tactical or 3D globe modes */}
            <div className="flex-[5.5] relative overflow-hidden rounded-lg border border-hud-border min-h-0">
              {/* Warzone crosshair overlay on map/globe */}
              {theme.effect === "warzone" && <div className="warzone-crosshair" aria-hidden="true" />}
              <MapViewToggle mode={mapMode} onModeChange={setMapMode} />
              <MapLayerPanel layers={layers} onToggleLayer={toggleMapLayer} />
              {mapMode === "2d" ? (
                <ErrorBoundary section="map" fallback={<MapSkeleton />}>
                  <TacticalMap filters={filters} variant={variant} enabledLayers={enabledLayerIds} />
                </ErrorBoundary>
              ) : (
                <ErrorBoundary section="globe" fallback={<MapSkeleton />}>
                  <Globe3D variant={variant} enabledLayers={enabledLayerIds} />
                </ErrorBoundary>
              )}
              {mapMode === "2d" && (
                <ErrorBoundary section="ticker">
                  <MarketTicker />
                </ErrorBoundary>
              )}
            </div>

            {/* Live Webcams */}
            <div className="flex-[4.5] min-h-0">
              <ErrorBoundary section="convergence">
                <ConvergencePanel />
              </ErrorBoundary>
            </div>
          </div>

          {/* ── Column 2: Live TV + Breaking + Storylines (Drag & Drop) ── */}
          <div className="flex-[3.5] min-w-0 col-stagger-2">
            <SortablePanels
              className="h-full"
              panels={[
                {
                  id: "storylines",
                  label: "STORYLINES",
                  node: (
                    <ErrorBoundary section="storylines">
                      <StorylinePanel />
                    </ErrorBoundary>
                  ),
                },
                {
                  id: "broadcasts",
                  label: "LIVE TV",
                  node: (
                    <ErrorBoundary section="broadcasts">
                      <LiveBroadcasts />
                    </ErrorBoundary>
                  ),
                },
                {
                  id: "alerts",
                  label: "ALERTS",
                  node: (
                    <ErrorBoundary section="alerts">
                      <BreakingAlerts />
                    </ErrorBoundary>
                  ),
                },
              ]}
            />
          </div>

          {/* ── Column 3: Tabbed Panel (Intel / Predictions / Economics) ── */}
          <div className="flex-[3] min-w-0 max-lg:hidden flex flex-col col-stagger-3">
            {/* Tab bar */}
            <div className="flex border-b border-hud-border/50 mb-1 shrink-0">
              {([
                { id: "intel" as const, label: "INTEL", icon: "📡" },
                { id: "predictions" as const, label: "PREDICT", icon: "📊" },
                { id: "economics" as const, label: "ECON", icon: "💹" },
                { id: "risk" as const, label: "RISK", icon: "⚠️" },
                { id: "escalation" as const, label: "ESCAL", icon: "🔺" },
                { id: "equity" as const, label: "EQUITY", icon: "📈" },
                { id: "geopolitics" as const, label: "GEO", icon: "🌐" },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 font-mono text-[7px] tracking-wider transition-all ${
                    rightTab === tab.id
                      ? "text-hud-accent border-b-2 border-hud-accent"
                      : "text-hud-muted hover:text-hud-text"
                  }`}
                >
                  <span className="text-[9px]">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {rightTab === "intel" && (
                <ErrorBoundary section="feed" fallback={<IntelFeedSkeleton />}>
                  <div className="px-1 pt-1 pb-0.5">
                    <SourceSelector
                      excludedSources={excludedSources}
                      onToggleSource={toggleSource}
                      onClearFilters={clearSourceFilters}
                    />
                  </div>
                  <Suspense fallback={<IntelFeedSkeleton />}>
                    <IntelFeed variant={variant} excludedSources={excludedSources} />
                  </Suspense>
                </ErrorBoundary>
              )}
              {rightTab === "predictions" && (
                <ErrorBoundary section="predictions">
                  <PredictionPanel />
                </ErrorBoundary>
              )}
              {rightTab === "economics" && (
                <ErrorBoundary section="economics">
                  <EconomicsPanel />
                </ErrorBoundary>
              )}
              {rightTab === "risk" && (
                <ErrorBoundary section="risk">
                  <div className="h-full overflow-y-auto space-y-2 p-1">
                    <MarketComposite />
                    <CountryRiskPanel />
                  </div>
                </ErrorBoundary>
              )}
              {rightTab === "equity" && (
                <ErrorBoundary section="equity">
                  <EquityResearchPanel />
                </ErrorBoundary>
              )}
              {rightTab === "escalation" && (
                <ErrorBoundary section="escalation">
                  <div className="h-full overflow-y-auto space-y-2 p-1">
                    <EscalationMonitor />
                    <AIStrategicBrief />
                  </div>
                </ErrorBoundary>
              )}
              {rightTab === "geopolitics" && (
                <ErrorBoundary section="geopolitics">
                  <GeopoliticalAnalysis />
                </ErrorBoundary>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* News Ticker — desktop only */}
      <div className="hidden md:block">
        <NewsTicker />
      </div>

      {/* Status Footer — desktop only */}
      <div className="hidden md:block">
        <StatusFooter />
        {/* Policy links for legal compliance */}
        <div className="h-4 bg-hud-surface/60 border-t border-hud-border/50 flex items-center justify-center gap-4 font-mono text-[6px] text-hud-muted/40">
          <a href="/terms" className="hover:text-hud-accent/60 transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-hud-accent/60 transition-colors">Privacy</a>
          <a href="/refund" className="hover:text-hud-accent/60 transition-colors">Refund</a>
          <a href="/contact" className="hover:text-hud-accent/60 transition-colors">Contact</a>
          <a href="/about" className="hover:text-hud-accent/60 transition-colors">About</a>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        variant={variant}
        activePanel={mobilePanel}
        onPanelChange={setMobilePanel}
      />

      {/* Keyboard Shortcuts Help — press ? to toggle */}
      <KeyboardHelp />
      {/* Breaking Alert Toast */}
      <BreakingToast />
      {/* Offline indicator */}
      <ConnectionStatus />
      {/* Command Palette — Ctrl/Cmd+K */}
      <CommandPalette />
      {/* Newsletter signup popup */}
      <NewsletterPopup />
    </div>
  );
}
