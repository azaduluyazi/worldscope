"use client";

import { useState, memo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  PanelLeftClose,
  PanelLeftOpen,
  AlertTriangle,
  Activity,
  Zap,
  Shield,
} from "lucide-react";
import type { VariantId } from "@/config/variants";

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

const CATEGORY_FILTERS = [
  { id: "conflict", icon: "\u2694\uFE0F", label: "Conflict", color: "#ff4757" },
  { id: "natural", icon: "\uD83C\uDF0D", label: "Natural", color: "#00ff88" },
  { id: "cyber", icon: "\uD83D\uDEE1\uFE0F", label: "Cyber", color: "#00e5ff" },
  { id: "aviation", icon: "\uD83D\uDEEB", label: "Aviation", color: "#c471ed" },
  { id: "health", icon: "\uD83C\uDFE5", label: "Health", color: "#ff4757" },
  { id: "diplomacy", icon: "\uD83C\uDFDB\uFE0F", label: "Diplomacy", color: "#00e5ff" },
  { id: "energy", icon: "\u26A1", label: "Energy", color: "#ffd000" },
  { id: "protest", icon: "\uD83D\uDCE2", label: "Protests", color: "#ff4757" },
  { id: "sports", icon: "\u26BD", label: "Sports", color: "#22c55e" },
];

const panelAnim = (delay: number) => ({
  initial: { opacity: 0, y: 20 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { type: "spring" as const, damping: 22, stiffness: 180, delay },
});

/* ================================================================== */

export const HotelLayout = memo(function HotelLayout({ variant }: FullLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="relative flex flex-col w-full h-screen bg-black overflow-hidden">
      {/* ── MAIN ROW ────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              className="flex flex-col bg-black/80 backdrop-blur-xl border-r border-cyan-900/30 overflow-hidden shrink-0"
            >
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-900/30 shrink-0">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider uppercase">
                    Hotel View
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-600 hover:text-cyan-400 transition-colors"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              {/* Category filters */}
              <div className="px-2 py-2 border-b border-cyan-900/20 shrink-0">
                <span className="px-1 font-mono text-[8px] text-gray-500 tracking-wider uppercase">
                  Filters
                </span>
                <div className="mt-1.5 grid grid-cols-3 gap-1">
                  {CATEGORY_FILTERS.map((cat) => {
                    const isActive = activeCategories.has(cat.id);
                    return (
                      <motion.button
                        key={cat.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleCategory(cat.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-left font-mono text-[8px] tracking-wider transition-colors border ${
                          isActive
                            ? "border-cyan-500/50 bg-cyan-900/30 text-cyan-300"
                            : "border-gray-800 bg-gray-900/50 text-gray-500 hover:text-gray-300 hover:border-gray-700"
                        }`}
                      >
                        <span className="text-xs">{cat.icon}</span>
                        <span className="truncate uppercase">{cat.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* IntelFeed (main scrollable) */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <IntelFeed />
              </div>

              {/* Stats footer */}
              <div className="px-3 py-2 border-t border-cyan-900/30 space-y-1.5 shrink-0">
                <span className="font-mono text-[8px] text-gray-500 tracking-wider uppercase">
                  Severity Distribution
                </span>
                <div className="flex items-center gap-1">
                  {(["critical", "high", "medium", "low", "info"] as const).map((sev) => {
                    const colors: Record<string, string> = {
                      critical: "bg-red-500",
                      high: "bg-yellow-500",
                      medium: "bg-cyan-500",
                      low: "bg-green-500",
                      info: "bg-purple-500",
                    };
                    return (
                      <div key={sev} className="flex flex-col items-center gap-0.5">
                        <div className={`w-6 h-1 rounded-full ${colors[sev]} ${sev === "critical" ? "animate-pulse" : ""}`} />
                        <span className="font-mono text-[7px] text-gray-600 uppercase">{sev.slice(0, 4)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Sidebar toggle (when collapsed) */}
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", damping: 20 }}
            onClick={() => setSidebarOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center w-6 h-16 bg-black/80 border border-cyan-900/30 border-l-0 rounded-r-md text-gray-500 hover:text-cyan-400 transition-colors"
          >
            <PanelLeftOpen className="w-3.5 h-3.5" />
          </motion.button>
        )}

        {/* MAIN AREA */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top row (55%): Globe + LiveBroadcasts */}
          <div className="flex flex-col md:flex-row h-[55%] min-h-0 gap-px bg-cyan-900/10">
            <motion.div
              {...panelAnim(0.1)}
              className="relative flex-[2] min-w-0 bg-black/70 backdrop-blur-lg"
            >
              <Globe3D variant={variant} />
              <div className="absolute top-3 left-3 z-20">
                <MapViewToggle mode="globe-intel" onModeChange={() => {}} />
              </div>
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-green-400 animate-pulse" />
                <span className="font-mono text-[8px] text-green-400 tracking-wider">LIVE</span>
              </div>
            </motion.div>

            <motion.div
              {...panelAnim(0.18)}
              className="flex-1 min-w-0 flex flex-col bg-black/70 backdrop-blur-lg border-l border-cyan-900/20"
            >
              <div className="px-3 py-1.5 border-b border-cyan-900/30 shrink-0">
                <span className="font-mono text-[9px] font-bold text-red-400 tracking-wider uppercase">
                  Live Broadcasts
                </span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <LiveBroadcasts />
              </div>
            </motion.div>
          </div>

          {/* Bottom row (40%): BreakingAlerts + ConvergencePanel + Predictions */}
          <div className="flex flex-col md:flex-row flex-1 min-h-0 gap-px bg-cyan-900/10">
            <motion.div
              {...panelAnim(0.26)}
              className="flex-1 min-w-0 flex flex-col bg-black/70 backdrop-blur-lg"
            >
              <div className="px-3 py-1.5 border-b border-red-900/30 shrink-0">
                <span className="font-mono text-[9px] font-bold text-red-400 tracking-wider uppercase">
                  Breaking Alerts
                </span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <BreakingAlerts />
              </div>
            </motion.div>

            <motion.div
              {...panelAnim(0.34)}
              className="flex-1 min-w-0 flex flex-col bg-black/70 backdrop-blur-lg border-l border-cyan-900/20"
            >
              <div className="px-3 py-1.5 border-b border-cyan-900/30 shrink-0">
                <span className="font-mono text-[9px] font-bold text-green-400 tracking-wider uppercase">
                  Live Webcams
                </span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <ConvergencePanel />
              </div>
            </motion.div>

            <motion.div
              {...panelAnim(0.42)}
              className="flex-1 min-w-0 flex flex-col bg-black/70 backdrop-blur-lg border-l border-cyan-900/20"
            >
              <div className="px-3 py-1.5 border-b border-cyan-900/30 shrink-0">
                <span className="font-mono text-[9px] font-bold text-purple-400 tracking-wider uppercase">
                  AI Predictions
                </span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
                <PredictionPanel />
              </div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT EDGE: vertical MarketTicker */}
        <motion.div
          initial={{ x: 60 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", damping: 22, delay: 0.3 }}
          className="hidden xl:flex w-10 flex-col bg-black/80 backdrop-blur-xl border-l border-cyan-900/30 overflow-hidden"
        >
          <div className="py-2 text-center border-b border-cyan-900/30">
            <Activity className="w-3 h-3 text-cyan-400 mx-auto" />
          </div>
          <div className="flex-1 overflow-hidden [writing-mode:vertical-rl] rotate-180">
            <MarketTicker />
          </div>
        </motion.div>
      </div>

      {/* ── BOTTOM BAR ──────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22, delay: 0.25 }}
        className="relative z-40 shrink-0 border-t border-cyan-900/40 bg-black/80 backdrop-blur-xl"
      >
        <NewsTicker />
        <StatusFooter />
      </motion.div>
    </div>
  );
});
