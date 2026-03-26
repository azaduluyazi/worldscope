"use client";

import { useState, memo, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Minimize2,
  Maximize2,
  X,
  Tv,
  FileText,
  AlertTriangle,
  BarChart3,
  Camera,
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

type PipId = "broadcasts" | "intel" | "alerts" | "data";

interface PipState {
  visible: boolean;
  minimized: boolean;
}

type PipStates = Record<PipId, PipState>;

const PIP_CONFIG: {
  id: PipId;
  title: string;
  icon: typeof Tv;
  position: string;
  width: string;
}[] = [
  { id: "broadcasts", title: "LIVE TV", icon: Tv, position: "top-14 right-4", width: "w-96" },
  { id: "intel", title: "INTEL FEED", icon: FileText, position: "bottom-20 right-4", width: "w-80" },
  { id: "alerts", title: "ALERTS / CAMS", icon: AlertTriangle, position: "bottom-20 left-4", width: "w-80" },
  { id: "data", title: "PREDICTIONS", icon: BarChart3, position: "top-14 left-4", width: "w-72" },
];

/* ================================================================== */

export const IndiaLayout = memo(function IndiaLayout({ variant }: FullLayoutProps) {
  const [pips, setPips] = useState<PipStates>({
    broadcasts: { visible: true, minimized: false },
    intel: { visible: true, minimized: false },
    alerts: { visible: true, minimized: false },
    data: { visible: true, minimized: false },
  });

  const [alertsTab, setAlertsTab] = useState<"alerts" | "webcams">("alerts");
  const [dataTab, setDataTab] = useState<"predictions" | "economics">("predictions");

  const toggleMinimize = useCallback((id: PipId) => {
    setPips((prev) => ({
      ...prev,
      [id]: { ...prev[id], minimized: !prev[id].minimized },
    }));
  }, []);

  const toggleVisible = useCallback((id: PipId) => {
    setPips((prev) => ({
      ...prev,
      [id]: { ...prev[id], visible: !prev[id].visible },
    }));
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* ── FULL-SCREEN GLOBE ───────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <Globe3D variant={variant} />
      </div>

      {/* Globe controls */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30">
        <MapViewToggle mode="globe-intel" onModeChange={() => {}} />
      </div>

      {/* Live indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-3 right-4 z-30 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-cyan-900/30"
      >
        <Radio className="w-3 h-3 text-green-400 animate-pulse" />
        <span className="font-mono text-[8px] text-green-400 tracking-wider">LIVE</span>
      </motion.div>

      {/* Hidden PiP restore buttons */}
      <div className="absolute top-3 left-4 z-50 flex gap-1">
        {PIP_CONFIG.filter((p) => !pips[p.id].visible).map((pip) => {
          const Icon = pip.icon;
          return (
            <motion.button
              key={pip.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => toggleVisible(pip.id)}
              className="flex items-center gap-1 px-2 py-1 bg-black/80 backdrop-blur-md rounded border border-cyan-900/40 text-gray-500 hover:text-cyan-400 transition-colors"
            >
              <Icon className="w-3 h-3" />
              <span className="font-mono text-[7px] tracking-wider">{pip.title}</span>
            </motion.button>
          );
        })}
      </div>

      {/* ── PiP WINDOWS ─────────────────────────────────────────── */}
      <AnimatePresence>
        {PIP_CONFIG.map((pip) => {
          const state = pips[pip.id];
          if (!state.visible) return null;
          const Icon = pip.icon;

          return (
            <motion.div
              key={pip.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                height: state.minimized ? "auto" : undefined,
              }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              className={`absolute ${pip.position} z-40 ${pip.width} flex flex-col bg-black/70 backdrop-blur-lg rounded-lg border border-cyan-900/30 shadow-2xl shadow-black/60 overflow-hidden`}
              style={{ maxHeight: state.minimized ? "auto" : "45vh" }}
            >
              {/* Title bar */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-cyan-900/30 shrink-0 cursor-move">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3 h-3 text-cyan-400" />
                  <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider">
                    {pip.title}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleMinimize(pip.id)}
                    className="text-gray-600 hover:text-cyan-400 transition-colors p-0.5"
                  >
                    {state.minimized ? (
                      <Maximize2 className="w-3 h-3" />
                    ) : (
                      <Minimize2 className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleVisible(pip.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <AnimatePresence>
                {!state.minimized && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 overflow-y-auto scrollbar-thin"
                  >
                    {pip.id === "broadcasts" && <LiveBroadcasts />}

                    {pip.id === "intel" && <IntelFeed />}

                    {pip.id === "alerts" && (
                      <div className="flex flex-col">
                        <div className="flex border-b border-cyan-900/20 shrink-0">
                          <button
                            onClick={() => setAlertsTab("alerts")}
                            className={`flex-1 py-1 font-mono text-[8px] font-bold tracking-wider uppercase text-center transition-colors ${
                              alertsTab === "alerts"
                                ? "text-red-400 bg-red-900/20"
                                : "text-gray-600 hover:text-gray-400"
                            }`}
                          >
                            Alerts
                          </button>
                          <button
                            onClick={() => setAlertsTab("webcams")}
                            className={`flex-1 py-1 font-mono text-[8px] font-bold tracking-wider uppercase text-center transition-colors ${
                              alertsTab === "webcams"
                                ? "text-green-400 bg-green-900/20"
                                : "text-gray-600 hover:text-gray-400"
                            }`}
                          >
                            Webcams
                          </button>
                        </div>
                        {alertsTab === "alerts" ? <BreakingAlerts /> : <LiveWebcams />}
                      </div>
                    )}

                    {pip.id === "data" && (
                      <div className="flex flex-col">
                        <div className="flex border-b border-cyan-900/20 shrink-0">
                          <button
                            onClick={() => setDataTab("predictions")}
                            className={`flex-1 py-1 font-mono text-[8px] font-bold tracking-wider uppercase text-center transition-colors ${
                              dataTab === "predictions"
                                ? "text-cyan-400 bg-cyan-900/20"
                                : "text-gray-600 hover:text-gray-400"
                            }`}
                          >
                            Predictions
                          </button>
                          <button
                            onClick={() => setDataTab("economics")}
                            className={`flex-1 py-1 font-mono text-[8px] font-bold tracking-wider uppercase text-center transition-colors ${
                              dataTab === "economics"
                                ? "text-yellow-400 bg-yellow-900/20"
                                : "text-gray-600 hover:text-gray-400"
                            }`}
                          >
                            Economics
                          </button>
                        </div>
                        <div className="p-2">
                          {dataTab === "predictions" ? <PredictionPanel /> : <EconomicsPanel />}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* ── BOTTOM BAR ──────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22, delay: 0.3 }}
        className="absolute bottom-0 left-0 right-0 z-40 border-t border-cyan-900/40 bg-black/80 backdrop-blur-xl"
      >
        <div className="flex">
          <div className="flex-1 min-w-0">
            <MarketTicker />
          </div>
        </div>
        <NewsTicker />
        <StatusFooter />
      </motion.div>
    </div>
  );
});
