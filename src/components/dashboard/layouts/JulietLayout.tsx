"use client";

import { useRef, memo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Radio,
  Shield,
  AlertTriangle,
  Activity,
  ChevronLeft,
  ChevronRight,
  Globe,
  Tv,
  FileText,
  Camera,
  BarChart3,
} from "lucide-react";
import type { VariantId } from "@/config/variants";

const Globe3D = dynamic(
  () => import("@/components/dashboard/Globe3D").then((m) => m.Globe3D),
  { ssr: false }
);

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

/* ------------------------------------------------------------------ */

interface FullLayoutProps {
  variant: VariantId;
}

const SIDEBAR_ICONS = [
  { id: "conflict", icon: "\u2694\uFE0F", color: "#ff4757" },
  { id: "natural", icon: "\uD83C\uDF0D", color: "#00ff88" },
  { id: "cyber", icon: "\uD83D\uDEE1\uFE0F", color: "#00e5ff" },
  { id: "aviation", icon: "\uD83D\uDEEB", color: "#c471ed" },
  { id: "health", icon: "\uD83C\uDFE5", color: "#ff4757" },
  { id: "diplomacy", icon: "\uD83C\uDFDB\uFE0F", color: "#00e5ff" },
  { id: "energy", icon: "\u26A1", color: "#ffd000" },
  { id: "protest", icon: "\uD83D\uDCE2", color: "#ff4757" },
];

const panelAnim = (delay: number) => ({
  initial: { opacity: 0, x: 40 } as const,
  animate: { opacity: 1, x: 0 } as const,
  transition: { type: "spring" as const, damping: 22, stiffness: 180, delay },
});

/* ================================================================== */

export const JulietLayout = memo(function JulietLayout({ variant }: FullLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="relative flex flex-col w-full h-screen bg-black overflow-hidden">
      {/* ── TOP STATUS BAR ──────────────────────────────────────── */}
      <motion.header
        initial={{ y: -44 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22 }}
        className="relative z-40 flex items-center justify-between h-10 px-4 bg-black/80 backdrop-blur-xl border-b border-cyan-900/40 shrink-0"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-widest">
            JULIET // MISSION CONTROL
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
            <span className="font-mono text-[9px] text-yellow-400 tracking-wider">ELEVATED</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-green-400 animate-pulse" />
            <span className="font-mono text-[8px] text-green-400">LIVE</span>
          </div>
          <span className="font-mono text-[9px] text-gray-600">
            {new Date().toISOString().slice(11, 19)} UTC
          </span>
        </div>

        {/* Scroll arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scrollBy(-400)}
            className="p-1 text-gray-600 hover:text-cyan-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollBy(400)}
            className="p-1 text-gray-600 hover:text-cyan-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.header>

      {/* ── MAIN AREA ───────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left icon strip */}
        <motion.nav
          initial={{ x: -56 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", damping: 22 }}
          className="hidden md:flex w-14 flex-col items-center py-3 gap-2 bg-black/80 backdrop-blur-xl border-r border-cyan-900/30 shrink-0"
        >
          {SIDEBAR_ICONS.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              whileHover={{ scale: 1.15, backgroundColor: "rgba(0,229,255,0.1)" }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-transparent hover:border-cyan-900/40 transition-colors"
              title={item.id}
            >
              <span className="text-base">{item.icon}</span>
            </motion.button>
          ))}

          <div className="flex-1" />

          <div className="flex flex-col items-center gap-1.5 mt-auto">
            <Activity className="w-3.5 h-3.5 text-cyan-400/50" />
            <span className="font-mono text-[7px] text-gray-600 [writing-mode:vertical-rl] rotate-180 tracking-wider">
              SOURCES ACTIVE
            </span>
          </div>
        </motion.nav>

        {/* Horizontal scroll container */}
        <div
          ref={scrollRef}
          className="flex flex-1 min-h-0 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-thin scrollbar-track-black scrollbar-thumb-cyan-900/40"
        >
          {/* Panel 1: Globe3D */}
          <motion.section
            {...panelAnim(0.05)}
            className="relative w-[600px] min-w-[600px] h-full shrink-0 snap-start border-r border-cyan-900/20"
          >
            <div className="absolute top-2 left-3 z-20 flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider uppercase">
                Tactical Globe
              </span>
            </div>
            <div className="absolute top-10 left-3 z-20">
              <MapViewToggle mode="globe-intel" onModeChange={() => {}} />
            </div>
            <Globe3D variant={variant} />
          </motion.section>

          {/* Panel 2: LiveBroadcasts */}
          <motion.section
            {...panelAnim(0.12)}
            className="flex flex-col w-[400px] min-w-[400px] h-full shrink-0 snap-start bg-black/70 backdrop-blur-lg border-r border-cyan-900/20"
          >
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-cyan-900/30 shrink-0">
              <Tv className="w-3 h-3 text-red-400" />
              <span className="font-mono text-[9px] font-bold text-red-400 tracking-wider uppercase">
                Live Broadcasts
              </span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <LiveBroadcasts />
            </div>
          </motion.section>

          {/* Panel 3: IntelFeed */}
          <motion.section
            {...panelAnim(0.19)}
            className="flex flex-col w-[350px] min-w-[350px] h-full shrink-0 snap-start bg-black/70 backdrop-blur-lg border-r border-cyan-900/20"
          >
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-cyan-900/30 shrink-0">
              <FileText className="w-3 h-3 text-cyan-400" />
              <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider uppercase">
                Intel Feed
              </span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <IntelFeed />
            </div>
          </motion.section>

          {/* Panel 4: BreakingAlerts + LiveWebcams stacked */}
          <motion.section
            {...panelAnim(0.26)}
            className="flex flex-col w-[350px] min-w-[350px] h-full shrink-0 snap-start bg-black/70 backdrop-blur-lg border-r border-cyan-900/20"
          >
            {/* Top half: BreakingAlerts */}
            <div className="flex flex-col h-1/2 min-h-0 border-b border-cyan-900/20">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-red-900/30 shrink-0">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span className="font-mono text-[9px] font-bold text-red-400 tracking-wider uppercase">
                  Breaking Alerts
                </span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <BreakingAlerts />
              </div>
            </div>

            {/* Bottom half: LiveWebcams */}
            <div className="flex flex-col h-1/2 min-h-0">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-green-900/30 shrink-0">
                <Camera className="w-3 h-3 text-green-400" />
                <span className="font-mono text-[9px] font-bold text-green-400 tracking-wider uppercase">
                  Live Webcams
                </span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <LiveWebcams />
              </div>
            </div>
          </motion.section>

          {/* Panel 5: Predictions + Economics stacked */}
          <motion.section
            {...panelAnim(0.33)}
            className="flex flex-col w-[400px] min-w-[400px] h-full shrink-0 snap-start bg-black/70 backdrop-blur-lg"
          >
            {/* Top half: PredictionPanel */}
            <div className="flex flex-col h-1/2 min-h-0 border-b border-cyan-900/20">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-purple-900/30 shrink-0">
                <BarChart3 className="w-3 h-3 text-purple-400" />
                <span className="font-mono text-[9px] font-bold text-purple-400 tracking-wider uppercase">
                  AI Predictions
                </span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
                <PredictionPanel />
              </div>
            </div>

            {/* Bottom half: EconomicsPanel */}
            <div className="flex flex-col h-1/2 min-h-0">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-yellow-900/30 shrink-0">
                <Activity className="w-3 h-3 text-yellow-400" />
                <span className="font-mono text-[9px] font-bold text-yellow-400 tracking-wider uppercase">
                  Economic Data
                </span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
                <EconomicsPanel />
              </div>
            </div>
          </motion.section>
        </div>
      </div>

      {/* ── BOTTOM BAR ──────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22, delay: 0.2 }}
        className="relative z-40 shrink-0 border-t border-cyan-900/40 bg-black/80 backdrop-blur-xl"
      >
        <div className="flex">
          <div className="flex-1 min-w-0 border-r border-cyan-900/20">
            <MarketTicker />
          </div>
          <div className="flex-1 min-w-0">
            <NewsTicker />
          </div>
        </div>
        <StatusFooter />
      </motion.div>
    </div>
  );
});
