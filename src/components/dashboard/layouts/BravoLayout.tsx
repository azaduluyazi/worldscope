"use client";

import { useState, useEffect, memo, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Radio, AlertTriangle, Activity, Satellite, BarChart3,
  Brain, TrendingUp, Clock, Eye,
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
const slideLeft = {
  initial: { x: -400, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { type: "spring" as const, damping: 26, stiffness: 180 },
};

const slideRight = {
  initial: { x: 400, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { type: "spring" as const, damping: 26, stiffness: 180 },
};

/* ---------- UTC clock ---------- */
function UtcClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-[10px] text-cyan-300 tabular-nums">{time} UTC</span>;
}

/* ---------- tab types ---------- */
type RightTab = "economics" | "predictions";

function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1.5 border-b border-cyan-900/30 shrink-0 flex items-center gap-2">
      <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider uppercase">
        {children}
      </span>
    </div>
  );
}

/* ================================================================
 *  BravoLayout — "Centered Globe + Surrounding Panels"
 * ================================================================ */
export function BravoLayout({ variant }: FullLayoutProps) {
  const [rightTab, setRightTab] = useState<RightTab>("predictions");

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
      {/* ─── TOP STATUS BAR ─── */}
      <motion.div
        initial={{ y: -40 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="shrink-0 h-9 flex items-center justify-between px-4 bg-black/60 backdrop-blur-md border-b border-cyan-900/40 z-30"
      >
        <div className="flex items-center gap-3">
          <Satellite className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-widest">
            WORLDSCOPE BRAVO
          </span>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-[9px] text-red-400">THREAT ELEVATED</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-green-400" />
            <span className="font-mono text-[9px] text-green-400">ACTIVE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-cyan-500" />
            <UtcClock />
          </div>
        </div>
      </motion.div>

      {/* ─── MAIN AREA: left panel | globe center | right panel ─── */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* LEFT PANEL (w-80) */}
        <motion.div
          {...slideLeft}
          className="w-full md:w-80 shrink-0 flex flex-col bg-black/70 backdrop-blur-lg border-r border-cyan-900/30 overflow-hidden"
        >
          {/* Live Broadcasts — top 50 % */}
          <div className="h-1/2 flex flex-col border-b border-cyan-900/30 overflow-hidden">
            <PanelHeader>
              <Radio className="w-3 h-3 text-red-400 animate-pulse inline mr-1.5" />
              LIVE BROADCASTS
            </PanelHeader>
            <div className="flex-1 overflow-hidden">
              <LiveBroadcasts />
            </div>
          </div>

          {/* Intel Feed — bottom 50 % */}
          <div className="h-1/2 flex flex-col overflow-hidden">
            <PanelHeader>
              <AlertTriangle className="w-3 h-3 text-cyan-400 inline mr-1.5" />
              INTEL FEED
            </PanelHeader>
            <div className="flex-1 overflow-hidden">
              <IntelFeed variant={variant} />
            </div>
          </div>
        </motion.div>

        {/* CENTER: Globe3D */}
        <div className="flex-1 relative min-h-[40vh] md:min-h-0">
          <Globe3D variant={variant} />
        </div>

        {/* RIGHT PANEL (w-80) */}
        <motion.div
          {...slideRight}
          className="w-full md:w-80 shrink-0 flex flex-col bg-black/70 backdrop-blur-lg border-l border-cyan-900/30 overflow-hidden"
        >
          {/* Breaking Alerts — top 30 % */}
          <div className="h-[30%] flex flex-col border-b border-cyan-900/30 overflow-hidden">
            <PanelHeader>
              <Shield className="w-3 h-3 text-red-400 inline mr-1.5" />
              BREAKING ALERTS
            </PanelHeader>
            <div className="flex-1 overflow-hidden">
              <BreakingAlerts />
            </div>
          </div>

          {/* Live Webcams — middle 30 % */}
          <div className="h-[30%] flex flex-col border-b border-cyan-900/30 overflow-hidden">
            <PanelHeader>
              <Activity className="w-3 h-3 text-green-400 inline mr-1.5" />
              LIVE WEBCAMS
            </PanelHeader>
            <div className="flex-1 overflow-hidden">
              <LiveWebcams />
            </div>
          </div>

          {/* Tabbed Economics / Predictions — bottom 40 % */}
          <div className="h-[40%] flex flex-col overflow-hidden">
            <div className="flex items-center border-b border-cyan-900/30 shrink-0">
              {(
                [
                  { id: "predictions" as RightTab, label: "PREDICTIONS", icon: Brain },
                  { id: "economics" as RightTab, label: "ECONOMICS", icon: BarChart3 },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 font-mono text-[8px] tracking-wider uppercase transition-colors ${
                    rightTab === tab.id
                      ? "text-cyan-400 bg-cyan-900/20 border-b-2 border-cyan-400"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {rightTab === "predictions" && (
                  <motion.div
                    key="pred"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <PredictionPanel />
                  </motion.div>
                )}
                {rightTab === "economics" && (
                  <motion.div
                    key="econ"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <EconomicsPanel />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── BOTTOM: MarketTicker + NewsTicker ─── */}
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="shrink-0 flex flex-col bg-black/80 backdrop-blur-md border-t border-cyan-900/40 z-20"
      >
        <MarketTicker />
        <div className="border-t border-cyan-900/20">
          <NewsTicker />
        </div>
      </motion.div>
    </div>
  );
}
