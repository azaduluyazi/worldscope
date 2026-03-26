"use client";

import { useState, memo, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Radio, AlertTriangle, Activity, BarChart3, Brain, TrendingUp,
} from "lucide-react";
import type { VariantId } from "@/config/variants";

/* ---------- dynamic heavy imports ---------- */
const TacticalMap = dynamic(
  () => import("@/components/dashboard/TacticalMap").then((m) => m.TacticalMap),
  { ssr: false },
);
const Globe3D = dynamic(
  () => import("@/components/dashboard/Globe3D").then((m) => m.Globe3D),
  { ssr: false },
);

/* ---------- dashboard component imports ---------- */
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

/* ---------- types ---------- */
interface FullLayoutProps {
  variant: VariantId;
}

/* ---------- animation helpers ---------- */
const stagger = (i: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, damping: 22, stiffness: 180, delay: i * 0.1 },
});

const panelHover = {
  whileHover: { scale: 1.005, borderColor: "rgba(0,229,255,0.4)" },
  transition: { type: "spring" as const, damping: 20 },
};

/* ---------- sub-components ---------- */
type BottomTab = "analysis" | "predictions" | "economics";

const BOTTOM_TABS: { id: BottomTab; label: string; icon: typeof Brain }[] = [
  { id: "analysis", label: "INTEL ANALYSIS", icon: Brain },
  { id: "predictions", label: "PREDICTIONS", icon: TrendingUp },
  { id: "economics", label: "ECONOMICS", icon: BarChart3 },
];

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1.5 border-b border-cyan-900/30 flex items-center gap-2">
      <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider uppercase">
        {children}
      </span>
    </div>
  );
}

/* ================================================================
 *  AlphaLayout — "Wide Globe + Triple Column"
 * ================================================================ */
export function AlphaLayout({ variant }: FullLayoutProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>("predictions");

  return (
    <div className="relative flex flex-col w-full h-screen bg-black overflow-hidden">
      {/* ─── TOP ROW (60 vh) ─── */}
      <motion.div
        {...stagger(0)}
        className="flex flex-col md:flex-row w-full"
        style={{ height: "60vh", minHeight: 0 }}
      >
        {/* Globe — 50 % */}
        <div className="relative w-full md:w-1/2 h-1/2 md:h-full">
          <Globe3D variant={variant} />

          {/* MarketTicker floating over globe bottom-left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, type: "spring", damping: 20 }}
            className="absolute bottom-2 left-2 right-2 z-10 bg-black/60 backdrop-blur-md border border-cyan-900/30 rounded-lg overflow-hidden"
          >
            <MarketTicker />
          </motion.div>
        </div>

        {/* LiveBroadcasts — 50 % */}
        <motion.div
          {...stagger(1)}
          className="w-full md:w-1/2 h-1/2 md:h-full bg-black/70 backdrop-blur-lg border-l border-cyan-900/30 overflow-hidden flex flex-col"
        >
          <PanelLabel>
            <Radio className="w-3 h-3 text-red-400 animate-pulse inline mr-1.5" />
            LIVE BROADCASTS
          </PanelLabel>
          <div className="flex-1 overflow-hidden">
            <LiveBroadcasts />
          </div>
        </motion.div>
      </motion.div>

      {/* ─── BOTTOM ROW (40 vh minus ticker) ─── */}
      <div
        className="flex flex-col md:flex-row w-full flex-1 min-h-0 border-t border-cyan-900/30"
      >
        {/* Col 1: IntelFeed */}
        <motion.div
          {...stagger(2)}
          {...panelHover}
          className="w-full md:w-1/3 h-1/3 md:h-full bg-black/70 backdrop-blur-lg border-r border-cyan-900/30 overflow-hidden flex flex-col"
        >
          <PanelLabel>
            <AlertTriangle className="w-3 h-3 text-cyan-400 inline mr-1.5" />
            INTEL FEED
          </PanelLabel>
          <div className="flex-1 overflow-hidden">
            <IntelFeed variant={variant} />
          </div>
        </motion.div>

        {/* Col 2: BreakingAlerts (top) + ConvergencePanel (bottom) */}
        <motion.div
          {...stagger(3)}
          className="w-full md:w-1/3 h-1/3 md:h-full flex flex-col border-r border-cyan-900/30"
        >
          {/* Breaking Alerts — top half */}
          <div className="h-1/2 bg-black/70 backdrop-blur-lg border-b border-cyan-900/30 overflow-hidden flex flex-col">
            <PanelLabel>
              <Shield className="w-3 h-3 text-red-400 inline mr-1.5" />
              BREAKING ALERTS
            </PanelLabel>
            <div className="flex-1 overflow-hidden">
              <BreakingAlerts />
            </div>
          </div>

          {/* Live Webcams — bottom half */}
          <div className="h-1/2 bg-black/70 backdrop-blur-lg overflow-hidden flex flex-col">
            <PanelLabel>
              <Activity className="w-3 h-3 text-green-400 inline mr-1.5" />
              LIVE WEBCAMS
            </PanelLabel>
            <div className="flex-1 overflow-hidden">
              <ConvergencePanel />
            </div>
          </div>
        </motion.div>

        {/* Col 3: Tabbed panel */}
        <motion.div
          {...stagger(4)}
          className="w-full md:w-1/3 h-1/3 md:h-full bg-black/70 backdrop-blur-lg overflow-hidden flex flex-col"
        >
          {/* Tab bar */}
          <div className="flex items-center border-b border-cyan-900/30">
            {BOTTOM_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 font-mono text-[8px] tracking-wider uppercase transition-colors ${
                  activeTab === tab.id
                    ? "text-cyan-400 bg-cyan-900/20 border-b-2 border-cyan-400"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "analysis" && (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="h-full overflow-auto"
                >
                  <IntelFeed variant={variant} />
                </motion.div>
              )}
              {activeTab === "predictions" && (
                <motion.div
                  key="predictions"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="h-full"
                >
                  <PredictionPanel />
                </motion.div>
              )}
              {activeTab === "economics" && (
                <motion.div
                  key="economics"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="h-full"
                >
                  <EconomicsPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ─── FIXED: NewsTicker at very bottom ─── */}
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20, delay: 0.5 }}
        className="shrink-0 w-full bg-black/80 backdrop-blur-md border-t border-cyan-900/40"
      >
        <NewsTicker />
      </motion.div>
    </div>
  );
}
