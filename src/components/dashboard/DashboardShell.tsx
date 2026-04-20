"use client";

import { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { MapSkeleton, IntelFeedSkeleton } from "@/components/shared/Skeleton";
import { TopBar } from "./TopBar";
import { MobileBottomNav, type MobilePanel } from "./MobileBottomNav";
const BreakingToast = dynamic(
  () => import("./BreakingToast").then((m) => ({ default: m.BreakingToast })),
  { ssr: false }
);

/** Heavy components — lazy loaded to reduce initial JS bundle */
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
// WarzoneBreakingAlert retired 2026-04-20 — unified into NeonBreakingBanner
// with --banner-gradient theme variable. Component file kept for reference.
const SourceSelector = dynamic(
  () => import("./SourceSelector").then((m) => ({ default: m.SourceSelector })),
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
import { AdSenseUnit } from "@/components/ads";
import { AD_PLACEMENTS } from "@/config/ads";

const PANEL_ORDER: MobilePanel[] = ["map", "feed", "live", "alerts"];

/** Dynamic import Globe3D — Three.js only loads on mount (3D is the only map mode now) */
const Globe3D = dynamic(
  () => import("./Globe3D").then((mod) => ({ default: mod.Globe3D })),
  { ssr: false, loading: () => <MapSkeleton /> }
);

/** Defer heavy component mount until browser is idle — reduces TBT */
function useIdleLoad(delay = 1): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = requestIdleCallback(() => setReady(true), { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    // Safari fallback
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return ready;
}

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
  const mapReady = useIdleLoad(1);
  // IMPORTANT: useState initializers must return the SAME value on server and
  // client on the first render, otherwise React hydration fails with #418.
  // We start with the server-safe defaults (no localStorage access) and then
  // sync user preferences from localStorage in a post-hydration effect below.
  const [filters, setFilters] = useState<MapFilters>(() => ({
    ...DEFAULT_FILTERS,
    categories: new Set<string>(),
    severities: new Set<string>(),
  }));
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("map");
  const [leftTab, setLeftTab] = useState<"signal" | "breaking" | "stories">("signal");
  const [rightTab, setRightTab] = useState<"intel" | "predictions" | "economics" | "risk" | "equity" | "geopolitics" | "escalation">("intel");
  const { layers, toggleLayer: toggleMapLayer, enabledLayerIds } = useMapLayers();
  const variantConfig = VARIANTS[variant];

  // Source filtering state (persisted in localStorage)
  // Same rule as above: start with empty on both sides, hydrate from
  // localStorage in the effect below.
  const [excludedSources, setExcludedSources] = useState<Set<string>>(
    () => new Set()
  );

  // Hydrate localStorage-backed state AFTER mount. This intentionally runs
  // once (empty deps) so the initial SSR HTML matches the first client render,
  // preventing React #418. The cascading render is intentional and unavoidable
  // for localStorage-driven UI — eslint's set-state-in-effect rule is about
  // perf hygiene, not correctness. Any persisted user prefs are applied after
  // hydration, causing exactly one extra render per session.
  useEffect(() => {
    const prefs = loadPreferences();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters((prev) => ({
      ...prev,
      heatmap: prefs.mapLayers.heatmap,
      clusters: prefs.mapLayers.clusters,
      categories: new Set(prefs.categoryFilters),
    }));
    try {
      const stored = localStorage.getItem("ws-excluded-sources");
      if (stored) {
        setExcludedSources(new Set(JSON.parse(stored)));
      }
    } catch {
      /* localStorage parse failure — keep empty set */
    }
  }, []);

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
      {/* Unified theme-adaptive critical banner — replaces the previous
          two-banner stack (NeonBreakingBanner + WarzoneBreakingAlert).
          Colors come from --banner-gradient defined per-theme. */}
      <NeonBreakingBanner text={topBreaking?.title} />

      <TopBar variant={variant} />

      {/* Theme-specific: DEFCON threat-level bar (Warzone only) */}
      <DefconBar activeLevel={0} />

      <div className="flex-1 flex overflow-hidden [contain:layout]">
        {/* IconSidebar removed in v3.3 — its filters (category, heatmap,
            clusters) are all accessible via keyboard shortcuts
            (1-9, H, C, Esc) and via MapLayerPanel on the map itself.
            Policy links (TOS/PRV/RFD) moved to StatusFooter. */}

        {/* ═══════════════════════════════════════════════════════
            MOBILE LAYOUT (<md): Full-screen panels via bottom nav
            ═══════════════════════════════════════════════════════ */}
        <div ref={swipeRef} className="flex-1 md:hidden relative overflow-hidden">
          {/* Globe — 3D only, deferred until browser idle */}
          <div className={`absolute inset-0 ${mobilePanel === "map" ? "z-10" : "z-0"}`}>
            <ErrorBoundary section="globe" fallback={<MapSkeleton />}>
              {mapReady ? <Globe3D variant={variant} enabledLayers={enabledLayerIds} /> : <MapSkeleton />}
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
            DESKTOP LAYOUT (md+) — A2 mockup: 3-column
            Col 1: Tabbed Signal / Breaking / Storylines
            Col 2: Globe 3D (top) + Live Broadcasts (bottom)
            Col 3: Intel Feed + 6 analysis tabs (unchanged)
            ═══════════════════════════════════════════════════════ */}
        <div className="flex-1 hidden md:flex gap-1 p-1 overflow-hidden">

          {/* ── Col 1: Tabbed — Signal / Breaking / Storylines ── */}
          <div className="flex-[3] min-w-0 flex flex-col col-stagger-1">
            <div className="flex border-b border-hud-border/50 mb-1 shrink-0" role="tablist" aria-label="Signal panels">
              {([
                { id: "signal" as const, label: "SIGNAL", icon: "Ω" },
                { id: "breaking" as const, label: "BREAKING", icon: "⚠" },
                { id: "stories" as const, label: "STORYLINES", icon: "◈" },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={leftTab === tab.id}
                  onClick={() => setLeftTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 font-mono text-[8px] tracking-wider transition-all ${
                    leftTab === tab.id
                      ? "text-hud-accent border-b-2 border-hud-accent"
                      : "text-hud-muted hover:text-hud-text"
                  }`}
                >
                  <span className="text-[10px]">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {leftTab === "signal" && (
                <ErrorBoundary section="convergence">
                  <ConvergencePanel />
                </ErrorBoundary>
              )}
              {leftTab === "breaking" && (
                <ErrorBoundary section="alerts">
                  <BreakingAlerts />
                </ErrorBoundary>
              )}
              {leftTab === "stories" && (
                <ErrorBoundary section="storylines">
                  <StorylinePanel />
                </ErrorBoundary>
              )}
            </div>
          </div>

          {/* ── Col 2: Globe 3D + Live Broadcasts — 60 / 40 split
                 so the TV player is tall enough to actually watch. ── */}
          <div className="flex-[4.5] flex flex-col gap-1 min-w-0 col-stagger-2">
            <div className="flex-[6] relative overflow-hidden rounded-lg border border-hud-border min-h-0 [contain:strict]">
              {theme.effect === "warzone" && <div className="warzone-crosshair" aria-hidden="true" />}
              <MapLayerPanel layers={layers} onToggleLayer={toggleMapLayer} />
              {mapReady ? (
                <ErrorBoundary section="globe" fallback={<MapSkeleton />}>
                  <Globe3D variant={variant} enabledLayers={enabledLayerIds} />
                </ErrorBoundary>
              ) : (
                <MapSkeleton />
              )}
            </div>
            <div className="flex-[4] min-h-[280px] [contain:strict]">
              <ErrorBoundary section="broadcasts">
                <LiveBroadcasts />
              </ErrorBoundary>
            </div>
          </div>

          {/* ── Col 3: Intel Feed + 6 analysis tabs ── */}
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

      {/* Dashboard bottom ad banner — shared across homepage + all verticals.
          Uses the ws-landing-bottom slot (horizontal, responsive). Desktop
          only — mobile real estate is too tight for a 90px banner. */}
      <div className="hidden md:block border-t border-hud-border bg-hud-base py-2 px-4">
        <div className="max-w-5xl mx-auto">
          <AdSenseUnit
            slot={AD_PLACEMENTS.landing[0].slot!}
            format={AD_PLACEMENTS.landing[0].format as "horizontal"}
          />
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
