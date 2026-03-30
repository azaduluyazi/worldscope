"use client";

import { useState, memo, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Map,
  FileText,
  Tv,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { VariantId } from "@/config/variants";

const TacticalMap = dynamic(
  () => import("@/components/dashboard/TacticalMap").then((m) => m.TacticalMap),
  { ssr: false }
);
const Globe3D = dynamic(
  () => import("@/components/dashboard/Globe3D").then((m) => m.Globe3D),
  { ssr: false }
);

import { IntelFeed } from "@/components/dashboard/IntelFeed";
import { BreakingAlerts } from "@/components/dashboard/BreakingAlerts";
import { LiveBroadcasts } from "@/components/dashboard/LiveBroadcasts";
import { ConvergencePanel } from "@/components/dashboard/ConvergencePanel";
import { MarketTicker } from "@/components/dashboard/MarketTicker";
import { NewsTicker } from "@/components/dashboard/NewsTicker";
import { MapViewToggle } from "@/components/dashboard/MapViewToggle";
import { StatusFooter } from "@/components/dashboard/StatusFooter";
import { PredictionPanel } from "@/components/dashboard/PredictionPanel";
import { EconomicsPanel } from "@/components/dashboard/EconomicsPanel";

/* ------------------------------------------------------------------ */

interface FullLayoutProps {
  variant: VariantId;
}

type TabId = "map" | "intel" | "live" | "alerts" | "data";

const TABS: { id: TabId; label: string; icon: typeof Map }[] = [
  { id: "map", label: "MAP", icon: Map },
  { id: "intel", label: "INTEL", icon: FileText },
  { id: "live", label: "LIVE TV", icon: Tv },
  { id: "alerts", label: "ALERTS", icon: AlertTriangle },
  { id: "data", label: "DATA", icon: BarChart3 },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

/* ================================================================== */

export const FoxtrotLayout = memo(function FoxtrotLayout({ variant }: FullLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [direction, setDirection] = useState(0);

  const switchTab = (tab: TabId) => {
    const currentIdx = TABS.findIndex((t) => t.id === activeTab);
    const nextIdx = TABS.findIndex((t) => t.id === tab);
    setDirection(nextIdx > currentIdx ? 1 : -1);
    setActiveTab(tab);
  };

  return (
    <div className="relative flex flex-col w-full h-screen bg-black overflow-hidden">
      {/* ── TAB BAR ─────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -56 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22 }}
        className="relative z-40 flex items-center h-12 bg-black/80 backdrop-blur-xl border-b border-cyan-900/40 px-2 shrink-0"
      >
        <div className="flex items-center gap-1 mr-auto">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-widest hidden sm:inline">
            FOXTROT
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-4 py-2 font-mono text-[10px] tracking-wider transition-colors ${
                  isActive ? "text-cyan-300" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="foxtrot-tab-indicator"
                    className="absolute inset-x-1 -bottom-px h-[2px] bg-cyan-400 rounded-full"
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <span className="ml-auto font-mono text-[9px] text-gray-600">
          {new Date().toISOString().slice(11, 19)} UTC
        </span>
      </motion.nav>

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {activeTab === "map" && (
            <motion.div
              key="map"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", damping: 24, stiffness: 200 }}
              className="absolute inset-0 flex"
            >
              {/* Globe full screen */}
              <div className="relative flex-1">
                <Globe3D variant={variant} />
                {/* MarketTicker overlay at top */}
                <div className="absolute top-0 left-0 right-0 z-20">
                  <MarketTicker />
                </div>
                <div className="absolute top-12 left-4 z-20">
                  <MapViewToggle mode="globe-intel" onModeChange={() => {}} />
                </div>
              </div>
              {/* Mini IntelFeed sidebar */}
              <div className="hidden lg:flex w-80 flex-col bg-black/70 backdrop-blur-lg border-l border-cyan-900/30">
                <div className="px-3 py-2 border-b border-cyan-900/30">
                  <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider uppercase">
                    Intel Feed
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  <IntelFeed />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "intel" && (
            <motion.div
              key="intel"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", damping: 24, stiffness: 200 }}
              className="absolute inset-0 flex flex-col md:flex-row"
            >
              <div className="flex-1 overflow-y-auto bg-black/60 backdrop-blur-md">
                <IntelFeed />
              </div>
              <div className="w-full md:w-96 bg-black/70 backdrop-blur-lg border-l border-cyan-900/30 overflow-y-auto">
                <div className="px-3 py-2 border-b border-cyan-900/30">
                  <span className="font-mono text-[9px] font-bold text-red-400 tracking-wider uppercase">
                    Breaking Alerts
                  </span>
                </div>
                <BreakingAlerts />
              </div>
            </motion.div>
          )}

          {activeTab === "live" && (
            <motion.div
              key="live"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", damping: 24, stiffness: 200 }}
              className="absolute inset-0 flex flex-col md:flex-row gap-px bg-cyan-900/20"
            >
              <div className="flex-[3] min-h-0 bg-black/70 backdrop-blur-lg">
                <div className="px-3 py-2 border-b border-cyan-900/30">
                  <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider uppercase">
                    Live Broadcasts
                  </span>
                </div>
                <div className="h-[calc(100%-36px)] overflow-y-auto">
                  <LiveBroadcasts />
                </div>
              </div>
              <div className="flex-[2] min-h-0 bg-black/70 backdrop-blur-lg">
                <div className="px-3 py-2 border-b border-cyan-900/30">
                  <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider uppercase">
                    Global Webcams
                  </span>
                </div>
                <div className="h-[calc(100%-36px)] overflow-y-auto">
                  <ConvergencePanel />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "alerts" && (
            <motion.div
              key="alerts"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", damping: 24, stiffness: 200 }}
              className="absolute inset-0 flex flex-col md:flex-row"
            >
              <div className="flex-1 overflow-y-auto bg-black/60 backdrop-blur-md p-4">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="font-mono text-xs font-bold text-red-400 tracking-wider uppercase">
                    Threat Monitor
                  </span>
                </div>
                <BreakingAlerts />
              </div>
              {/* Threat stats sidebar */}
              <div className="w-full md:w-72 bg-black/70 backdrop-blur-lg border-l border-cyan-900/30 p-4 space-y-4">
                <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider uppercase">
                  Threat Stats
                </span>
                {(["critical", "high", "medium", "low"] as const).map((sev) => (
                  <div key={sev} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase text-gray-400">{sev}</span>
                      <span
                        className="font-mono text-xs font-bold"
                        style={{
                          color:
                            sev === "critical"
                              ? "#ff4757"
                              : sev === "high"
                              ? "#ffd000"
                              : sev === "medium"
                              ? "#00e5ff"
                              : "#00ff88",
                        }}
                      >
                        --
                      </span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        // eslint-disable-next-line react-hooks/purity
                        animate={{ width: `${Math.random() * 80 + 10}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor:
                            sev === "critical"
                              ? "#ff4757"
                              : sev === "high"
                              ? "#ffd000"
                              : sev === "medium"
                              ? "#00e5ff"
                              : "#00ff88",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "data" && (
            <motion.div
              key="data"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", damping: 24, stiffness: 200 }}
              className="absolute inset-0 flex flex-col md:flex-row gap-px bg-cyan-900/20"
            >
              <div className="flex-1 min-h-0 bg-black/70 backdrop-blur-lg">
                <div className="px-3 py-2 border-b border-cyan-900/30">
                  <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider uppercase">
                    AI Predictions
                  </span>
                </div>
                <div className="h-[calc(100%-36px)] overflow-y-auto p-3">
                  <PredictionPanel />
                </div>
              </div>
              <div className="flex-1 min-h-0 bg-black/70 backdrop-blur-lg">
                <div className="px-3 py-2 border-b border-cyan-900/30">
                  <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider uppercase">
                    Economic Data
                  </span>
                </div>
                <div className="h-[calc(100%-36px)] overflow-y-auto p-3">
                  <EconomicsPanel />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM BAR ──────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22, delay: 0.2 }}
        className="relative z-40 shrink-0 border-t border-cyan-900/40 bg-black/80 backdrop-blur-xl"
      >
        <NewsTicker />
        <StatusFooter />
      </motion.div>
    </div>
  );
});
