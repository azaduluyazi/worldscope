"use client";

import { useState, memo, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Radio, AlertTriangle, Activity, LayoutGrid, BarChart3,
  Brain, TrendingUp, Globe as GlobeIcon, Tv, Camera,
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
import { LiveWebcams } from "@/components/dashboard/LiveWebcams";
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

/* ---------- animation ---------- */
const cellAnim = (i: number) => ({
  initial: { opacity: 0, scale: 0.85, y: 15 },
  animate: { opacity: 1, scale: 1, y: 0 },
  transition: { type: "spring" as const, damping: 22, stiffness: 200, delay: i * 0.07 },
});

/* ---------- grid cell wrapper ---------- */
function GridCell({
  title,
  icon: Icon,
  children,
  className = "",
  index = 0,
}: {
  title: string;
  icon: typeof Shield;
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div
      {...cellAnim(index)}
      whileHover={{ borderColor: "rgba(0,229,255,0.5)" }}
      className={`bg-black/70 backdrop-blur-lg rounded-lg border border-cyan-900/30 overflow-hidden flex flex-col ${className}`}
    >
      <div className="px-3 py-1.5 border-b border-cyan-900/30 flex items-center gap-2 shrink-0">
        <Icon className="w-3 h-3 text-cyan-400" />
        <span className="font-mono text-[8px] font-bold text-cyan-400 tracking-wider uppercase">
          {title}
        </span>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </motion.div>
  );
}

/* ---------- tab types ---------- */
type BottomTab = "predictions" | "economics" | "analysis";

/* ================================================================
 *  DeltaLayout — "Dashboard Grid" (analytics-inspired)
 * ================================================================ */
export function DeltaLayout({ variant }: FullLayoutProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>("predictions");

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
      {/* ─── TOP BAR ─── */}
      <motion.div
        initial={{ y: -40 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="shrink-0 h-9 flex items-center justify-between px-4 bg-black/60 backdrop-blur-md border-b border-cyan-900/40 z-30"
      >
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-widest">
            DELTA GRID
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Radio className="w-3 h-3 text-green-400 animate-pulse" />
          <span className="font-mono text-[9px] text-green-400">LIVE</span>
        </div>
      </motion.div>

      {/* ─── 4x3 GRID (3 rows, auto-sized) ─── */}
      <div className="flex-1 min-h-0 p-2 grid grid-cols-1 md:grid-cols-3 grid-rows-[1fr_1fr_1fr] gap-2 overflow-hidden">
        {/* ROW 1 */}
        {/* [1,1] + [1,2] — Globe3D spanning 2 cols */}
        <GridCell
          title="GLOBAL OVERVIEW"
          icon={GlobeIcon}
          className="md:col-span-2"
          index={0}
        >
          <Globe3D variant={variant} />
        </GridCell>

        {/* [1,3] — Breaking Alerts */}
        <GridCell title="BREAKING ALERTS" icon={AlertTriangle} index={1}>
          <BreakingAlerts />
        </GridCell>

        {/* ROW 2 */}
        {/* [2,1] — Live Broadcasts */}
        <GridCell title="LIVE BROADCASTS" icon={Tv} index={2}>
          <LiveBroadcasts />
        </GridCell>

        {/* [2,2] — Intel Feed (scrollable) */}
        <GridCell title="INTEL FEED" icon={Shield} index={3}>
          <IntelFeed variant={variant} />
        </GridCell>

        {/* [2,3] — Live Webcams */}
        <GridCell title="LIVE WEBCAMS" icon={Camera} index={4}>
          <LiveWebcams />
        </GridCell>

        {/* ROW 3 */}
        {/* [3,1] — MarketTicker + Economics mini */}
        <GridCell title="MARKETS & ECONOMICS" icon={BarChart3} index={5}>
          <div className="flex flex-col h-full">
            <div className="h-1/2 border-b border-cyan-900/20 overflow-hidden">
              <MarketTicker />
            </div>
            <div className="h-1/2 overflow-hidden">
              <EconomicsPanel />
            </div>
          </div>
        </GridCell>

        {/* [3,2] + [3,3] — Tabbed panel spanning 2 cols */}
        <motion.div
          {...cellAnim(6)}
          whileHover={{ borderColor: "rgba(0,229,255,0.5)" }}
          className="md:col-span-2 bg-black/70 backdrop-blur-lg rounded-lg border border-cyan-900/30 overflow-hidden flex flex-col"
        >
          {/* Tab header */}
          <div className="flex items-center border-b border-cyan-900/30 shrink-0">
            {(
              [
                { id: "predictions" as BottomTab, label: "PREDICTIONS", icon: Brain },
                { id: "economics" as BottomTab, label: "ECONOMICS", icon: BarChart3 },
                { id: "analysis" as BottomTab, label: "INTEL ANALYSIS", icon: TrendingUp },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 font-mono text-[8px] tracking-wider uppercase transition-colors ${
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
              {activeTab === "predictions" && (
                <motion.div
                  key="pred"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full"
                >
                  <PredictionPanel />
                </motion.div>
              )}
              {activeTab === "economics" && (
                <motion.div
                  key="econ"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full"
                >
                  <EconomicsPanel />
                </motion.div>
              )}
              {activeTab === "analysis" && (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full"
                >
                  <IntelFeed variant={variant} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ─── BOTTOM: NewsTicker full width ─── */}
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20, delay: 0.5 }}
        className="shrink-0 bg-black/80 backdrop-blur-md border-t border-cyan-900/40 z-20"
      >
        <NewsTicker />
      </motion.div>
    </div>
  );
}
