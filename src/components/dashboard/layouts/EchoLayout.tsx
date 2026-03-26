"use client";

import { useState, useEffect, memo, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Radio, AlertTriangle, Activity, Eye, Clock, X,
  Tv, Camera, Newspaper, TrendingUp, BarChart3, Brain,
  ChevronRight, Maximize2, Minimize2,
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

/* ---------- panel config ---------- */
type PanelId = "broadcasts" | "intel" | "webcams" | "alerts" | "predictions" | "economics";

interface PanelDef {
  id: PanelId;
  label: string;
  icon: typeof Shield;
  position: string; // Tailwind positioning classes
  size: string;     // Tailwind width/height classes
}

const PANELS: PanelDef[] = [
  {
    id: "broadcasts",
    label: "LIVE BROADCASTS",
    icon: Tv,
    position: "top-12 left-2",
    size: "w-[380px] h-[40vh]",
  },
  {
    id: "intel",
    label: "INTEL FEED",
    icon: Newspaper,
    position: "top-12 right-2",
    size: "w-[380px] h-[60vh]",
  },
  {
    id: "webcams",
    label: "LIVE WEBCAMS",
    icon: Camera,
    position: "bottom-16 left-2",
    size: "w-[380px] h-[35vh]",
  },
  {
    id: "alerts",
    label: "BREAKING ALERTS",
    icon: AlertTriangle,
    position: "bottom-16 right-2",
    size: "w-[320px] h-[40vh]",
  },
  {
    id: "predictions",
    label: "PREDICTIONS",
    icon: Brain,
    position: "top-[55vh] left-[400px]",
    size: "w-[300px] h-[30vh]",
  },
  {
    id: "economics",
    label: "ECONOMICS",
    icon: BarChart3,
    position: "top-[55vh] right-[340px]",
    size: "w-[300px] h-[30vh]",
  },
];

/* ---------- panel spring animation ---------- */
const panelSpring = (panelId: PanelId) => {
  const directions: Record<PanelId, { x?: number; y?: number }> = {
    broadcasts: { x: -100 },
    intel: { x: 100 },
    webcams: { x: -100 },
    alerts: { x: 100 },
    predictions: { y: 60 },
    economics: { y: 60 },
  };
  const dir = directions[panelId];
  return {
    initial: { opacity: 0, ...dir },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, ...dir },
    transition: { type: "spring" as const, damping: 24, stiffness: 200 },
  };
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
  return <span className="tabular-nums">{time} UTC</span>;
}

/* ---------- panel content renderer ---------- */
function PanelContent({ id, variant }: { id: PanelId; variant: VariantId }) {
  switch (id) {
    case "broadcasts":
      return <LiveBroadcasts />;
    case "intel":
      return <IntelFeed variant={variant} />;
    case "webcams":
      return <ConvergencePanel />;
    case "alerts":
      return <BreakingAlerts />;
    case "predictions":
      return <PredictionPanel />;
    case "economics":
      return <EconomicsPanel />;
    default:
      return null;
  }
}

/* ================================================================
 *  EchoLayout — "Immersive Globe + Floating Cards"
 * ================================================================ */
export function EchoLayout({ variant }: FullLayoutProps) {
  const [visiblePanels, setVisiblePanels] = useState<Set<PanelId>>(
    () => new Set(PANELS.map((p) => p.id)),
  );
  const [showNav, setShowNav] = useState(false);

  const togglePanel = (id: PanelId) => {
    setVisiblePanels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const showAll = () => setVisiblePanels(new Set(PANELS.map((p) => p.id)));
  const hideAll = () => setVisiblePanels(new Set());

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* ─── Globe3D FULL SCREEN background ─── */}
      <div className="absolute inset-0 z-0">
        <Globe3D variant={variant} />
      </div>

      {/* ─── TOP-CENTER: Status bar ─── */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="absolute top-0 left-0 right-0 z-30 h-10 flex items-center justify-between px-4 bg-black/40 backdrop-blur-md border-b border-cyan-900/30"
      >
        <div className="flex items-center gap-3">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-widest">
            ECHO IMMERSIVE
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-green-400 animate-pulse" />
            <span className="font-mono text-[9px] text-green-400">LIVE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-cyan-500" />
            <span className="font-mono text-[9px] text-cyan-300">
              <UtcClock />
            </span>
          </div>

          {/* Panel toggle button */}
          <button
            onClick={() => setShowNav(!showNav)}
            className="font-mono text-[9px] text-cyan-400 bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-900/40 rounded px-2 py-0.5 transition-colors"
          >
            PANELS
          </button>
        </div>
      </motion.div>

      {/* ─── Panel toggle nav (dropdown) ─── */}
      <AnimatePresence>
        {showNav && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-10 right-2 z-40 w-56 bg-black/80 backdrop-blur-lg border border-cyan-900/40 rounded-lg overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-cyan-900/30 flex items-center justify-between">
              <span className="font-mono text-[9px] text-cyan-400 font-bold tracking-wider">
                TOGGLE PANELS
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={showAll}
                  className="font-mono text-[7px] text-green-400 hover:text-green-300 px-1"
                >
                  ALL
                </button>
                <button
                  onClick={hideAll}
                  className="font-mono text-[7px] text-red-400 hover:text-red-300 px-1"
                >
                  NONE
                </button>
              </div>
            </div>
            {PANELS.map((panel) => (
              <button
                key={panel.id}
                onClick={() => togglePanel(panel.id)}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-cyan-900/20 transition-colors"
              >
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${
                    visiblePanels.has(panel.id) ? "bg-cyan-400" : "bg-gray-600"
                  }`}
                />
                <panel.icon className="w-3 h-3 text-gray-400" />
                <span className="font-mono text-[9px] text-gray-300">{panel.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Floating panels ─── */}
      <AnimatePresence>
        {PANELS.map((panel) =>
          visiblePanels.has(panel.id) ? (
            <motion.div
              key={panel.id}
              {...panelSpring(panel.id)}
              className={`absolute z-20 ${panel.position} ${panel.size} bg-black/60 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col max-w-[calc(100vw-1rem)] max-h-[calc(100vh-7rem)]`}
            >
              {/* Panel header */}
              <div className="px-3 py-1.5 border-b border-cyan-900/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <panel.icon className="w-3 h-3 text-cyan-400" />
                  <span className="font-mono text-[8px] font-bold text-cyan-400 tracking-wider">
                    {panel.label}
                  </span>
                </div>
                <button
                  onClick={() => togglePanel(panel.id)}
                  className="text-gray-500 hover:text-cyan-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-hidden">
                <PanelContent id={panel.id} variant={variant} />
              </div>
            </motion.div>
          ) : null,
        )}
      </AnimatePresence>

      {/* ─── Collapsed panel buttons (when hidden) ─── */}
      <div className="absolute left-2 top-14 z-25 flex flex-col gap-1">
        {PANELS.filter((p) => !visiblePanels.has(p.id) && (p.id === "broadcasts" || p.id === "webcams")).map(
          (panel) => (
            <motion.button
              key={panel.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => togglePanel(panel.id)}
              className="flex items-center gap-1.5 bg-black/60 backdrop-blur border border-cyan-900/40 rounded px-2 py-1 font-mono text-[8px] text-cyan-400 hover:bg-cyan-900/30 transition-colors"
            >
              <panel.icon className="w-3 h-3" />
              {panel.label}
              <ChevronRight className="w-3 h-3" />
            </motion.button>
          ),
        )}
      </div>

      <div className="absolute right-2 top-14 z-25 flex flex-col gap-1">
        {PANELS.filter((p) => !visiblePanels.has(p.id) && (p.id === "intel" || p.id === "alerts")).map(
          (panel) => (
            <motion.button
              key={panel.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => togglePanel(panel.id)}
              className="flex items-center gap-1.5 bg-black/60 backdrop-blur border border-cyan-900/40 rounded px-2 py-1 font-mono text-[8px] text-cyan-400 hover:bg-cyan-900/30 transition-colors"
            >
              <panel.icon className="w-3 h-3" />
              {panel.label}
              <ChevronRight className="w-3 h-3" />
            </motion.button>
          ),
        )}
      </div>

      {/* ─── BOTTOM-CENTER: MarketTicker (full width, h-14) ─── */}
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="absolute bottom-0 left-0 right-0 z-20 h-14 bg-black/60 backdrop-blur-md border-t border-cyan-900/40"
      >
        <MarketTicker />
      </motion.div>

      {/* ─── Mobile responsive: stack panels vertically ─── */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .absolute.z-20[class*="top-12"],
          .absolute.z-20[class*="bottom-16"],
          .absolute.z-20[class*="top-[55vh]"] {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            bottom: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 50vh !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
