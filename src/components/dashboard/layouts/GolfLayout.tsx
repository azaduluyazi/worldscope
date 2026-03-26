"use client";

import { useState, memo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Radio,
  Shield,
  AlertTriangle,
  BarChart3,
  Activity,
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

const panelAnim = (delay: number) => ({
  initial: { opacity: 0, y: 30, scale: 0.96 } as const,
  animate: { opacity: 1, y: 0, scale: 1 } as const,
  transition: { type: "spring" as const, damping: 22, stiffness: 180, delay },
});

const PanelHeader = memo(function PanelHeader({
  title,
  accent = "cyan",
}: {
  title: string;
  accent?: string;
}) {
  const colorMap: Record<string, string> = {
    cyan: "text-cyan-400 border-cyan-900/30",
    red: "text-red-400 border-red-900/30",
    green: "text-green-400 border-green-900/30",
    yellow: "text-yellow-400 border-yellow-900/30",
    purple: "text-purple-400 border-purple-900/30",
  };
  const cls = colorMap[accent] ?? colorMap.cyan;
  return (
    <div className={`px-3 py-1.5 border-b ${cls.split(" ")[1]} flex items-center gap-2 shrink-0`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cls.split(" ")[0] === "text-red-400" ? "bg-red-400 animate-pulse" : `bg-${accent}-400`}`} />
      <span className={`font-mono text-[9px] font-bold tracking-wider uppercase ${cls.split(" ")[0]}`}>
        {title}
      </span>
    </div>
  );
});

/* ================================================================== */

export const GolfLayout = memo(function GolfLayout({ variant }: FullLayoutProps) {
  const [bottomTab, setBottomTab] = useState<"predictions" | "economics">("predictions");
  const [tickerMode, setTickerMode] = useState<"market" | "news">("market");

  return (
    <div className="relative flex flex-col w-full h-screen bg-black overflow-hidden">
      {/* ── TOP ROW (60vh) ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row h-[60vh] min-h-0 gap-px bg-cyan-900/10 shrink-0">
        {/* Globe3D — left 40% */}
        <motion.div
          {...panelAnim(0)}
          className="relative flex-[2] min-w-0 bg-black/70 backdrop-blur-lg"
        >
          <PanelHeader title="Tactical Globe" accent="cyan" />
          <div className="absolute inset-0 top-8">
            <Globe3D variant={variant} />
          </div>
          <div className="absolute top-12 left-3 z-20">
            <MapViewToggle mode="globe-intel" onModeChange={() => {}} />
          </div>
          <div className="absolute top-2 right-3 z-20 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-green-400 animate-pulse" />
            <span className="font-mono text-[8px] text-green-400">LIVE</span>
          </div>
        </motion.div>

        {/* LiveBroadcasts — center 35% */}
        <motion.div
          {...panelAnim(0.08)}
          className="flex-[1.75] min-w-0 flex flex-col bg-black/70 backdrop-blur-lg border-l border-cyan-900/20"
        >
          <PanelHeader title="Live Broadcasts" accent="red" />
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <LiveBroadcasts />
          </div>
        </motion.div>

        {/* BreakingAlerts — right 25% */}
        <motion.div
          {...panelAnim(0.16)}
          className="flex-[1.25] min-w-0 flex flex-col bg-black/70 backdrop-blur-lg border-l border-cyan-900/20"
        >
          <PanelHeader title="Breaking Alerts" accent="red" />
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <BreakingAlerts />
          </div>
        </motion.div>
      </div>

      {/* ── BOTTOM ROW (35vh) ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 gap-px bg-cyan-900/10">
        {/* IntelFeed — col 1 (30%) */}
        <motion.div
          {...panelAnim(0.24)}
          className="flex-[1.5] min-w-0 flex flex-col bg-black/70 backdrop-blur-lg"
        >
          <PanelHeader title="Intel Feed" accent="cyan" />
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <IntelFeed />
          </div>
        </motion.div>

        {/* LiveWebcams — col 2 (25%) */}
        <motion.div
          {...panelAnim(0.32)}
          className="flex-[1.25] min-w-0 flex flex-col bg-black/70 backdrop-blur-lg border-l border-cyan-900/20"
        >
          <PanelHeader title="Global Webcams" accent="green" />
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <LiveWebcams />
          </div>
        </motion.div>

        {/* Predictions / Economics — col 3 (25%) */}
        <motion.div
          {...panelAnim(0.4)}
          className="flex-[1.25] min-w-0 flex flex-col bg-black/70 backdrop-blur-lg border-l border-cyan-900/20"
        >
          <div className="flex items-center border-b border-cyan-900/30 shrink-0">
            {(["predictions", "economics"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setBottomTab(tab)}
                className={`flex-1 py-1.5 font-mono text-[9px] font-bold tracking-wider uppercase text-center transition-colors ${
                  bottomTab === tab
                    ? "text-cyan-400 bg-cyan-900/20"
                    : "text-gray-600 hover:text-gray-400"
                }`}
              >
                {tab === "predictions" ? "AI Predictions" : "Economics"}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
            {bottomTab === "predictions" ? <PredictionPanel /> : <EconomicsPanel />}
          </div>
        </motion.div>

        {/* Category / severity stats — col 4 (20%) */}
        <motion.div
          {...panelAnim(0.48)}
          className="flex-1 min-w-0 flex flex-col bg-black/70 backdrop-blur-lg border-l border-cyan-900/20"
        >
          <PanelHeader title="Severity Overview" accent="yellow" />
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {(["critical", "high", "medium", "low", "info"] as const).map((sev, i) => {
              const colors: Record<string, string> = {
                critical: "#ff4757",
                high: "#ffd000",
                medium: "#00e5ff",
                low: "#00ff88",
                info: "#8a5cf6",
              };
              return (
                <motion.div
                  key={sev}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase text-gray-400">{sev}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${sev === "critical" ? "animate-pulse" : ""}`}
                      style={{ backgroundColor: colors[sev] }}
                    />
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(10, Math.random() * 90)}%` }}
                      transition={{ duration: 0.8, delay: 0.7 + i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: colors[sev] }}
                    />
                  </div>
                </motion.div>
              );
            })}

            <div className="pt-3 border-t border-cyan-900/30 space-y-2">
              <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider uppercase">
                Categories
              </span>
              {["conflict", "natural", "cyber", "health", "energy", "diplomacy"].map((cat, i) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="font-mono text-[8px] text-gray-500 uppercase">{cat}</span>
                  <span className="font-mono text-[9px] text-gray-400">--</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── BOTTOM BAR (5vh) ────────────────────────────────────── */}
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22, delay: 0.3 }}
        className="relative z-40 shrink-0 border-t border-cyan-900/40 bg-black/80 backdrop-blur-xl"
      >
        <div className="flex items-center">
          <button
            onClick={() => setTickerMode((m) => (m === "market" ? "news" : "market"))}
            className="shrink-0 px-2 py-1 font-mono text-[8px] text-gray-500 hover:text-cyan-400 border-r border-cyan-900/30 transition-colors"
          >
            {tickerMode === "market" ? "MKT" : "NEWS"}
          </button>
          <div className="flex-1 min-w-0">
            {tickerMode === "market" ? <MarketTicker /> : <NewsTicker />}
          </div>
        </div>
        <StatusFooter />
      </motion.div>
    </div>
  );
});
