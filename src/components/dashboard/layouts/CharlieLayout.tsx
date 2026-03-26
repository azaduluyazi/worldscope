"use client";

import { useState, useRef, useEffect, memo, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion, useInView } from "framer-motion";
import {
  Shield, Radio, AlertTriangle, Activity, Layers, BarChart3,
  Brain, TrendingUp, Globe as GlobeIcon,
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

/* ---------- section wrapper with scroll-triggered animation ---------- */
function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ type: "spring", damping: 22, stiffness: 160, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function PanelBox({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: typeof Shield;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col ${className}`}
    >
      <div className="px-3 py-1.5 border-b border-cyan-900/30 flex items-center gap-2 shrink-0">
        <Icon className="w-3 h-3 text-cyan-400" />
        <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider uppercase">
          {title}
        </span>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

/* ================================================================
 *  CharlieLayout — "Full-Width Sections Stacked"
 * ================================================================ */
export function CharlieLayout({ variant }: FullLayoutProps) {
  return (
    <div className="w-full h-screen bg-black overflow-y-auto overflow-x-hidden custom-scrollbar">
      {/* ─── SECTION 1 (50 vh): Globe + LiveBroadcasts side-by-side ─── */}
      <AnimatedSection
        className="flex flex-col md:flex-row w-full border-b border-cyan-900/30"
        delay={0}
      >
        {/* Globe3D — 70 % */}
        <div className="relative w-full md:w-[70%] h-[35vh] md:h-[50vh]">
          <Globe3D variant={variant} />

          {/* Overlay label */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1 border border-cyan-900/30">
            <GlobeIcon className="w-3 h-3 text-cyan-400" />
            <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-widest">
              WORLDSCOPE CHARLIE
            </span>
            <Radio className="w-3 h-3 text-green-400 animate-pulse ml-2" />
            <span className="font-mono text-[8px] text-green-400">LIVE</span>
          </div>
        </div>

        {/* LiveBroadcasts — 30 % */}
        <div className="w-full md:w-[30%] h-[25vh] md:h-[50vh] bg-black/70 backdrop-blur-lg border-l border-cyan-900/30 flex flex-col overflow-hidden">
          <div className="px-3 py-1.5 border-b border-cyan-900/30 flex items-center gap-2 shrink-0">
            <Radio className="w-3 h-3 text-red-400 animate-pulse" />
            <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider">
              LIVE BROADCASTS
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <LiveBroadcasts />
          </div>
        </div>
      </AnimatedSection>

      {/* ─── SECTION 2 (25 vh): 4-column grid ─── */}
      <AnimatedSection
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-cyan-900/20 border-b border-cyan-900/30"
        delay={0.15}
      >
        {/* Col 1: Breaking Alerts */}
        <PanelBox title="BREAKING ALERTS" icon={AlertTriangle} className="h-[30vh] md:h-[25vh] rounded-none border-0">
          <BreakingAlerts />
        </PanelBox>

        {/* Col 2: Intel Feed */}
        <PanelBox title="INTEL FEED" icon={Shield} className="h-[30vh] md:h-[25vh] rounded-none border-0">
          <IntelFeed variant={variant} />
        </PanelBox>

        {/* Col 3: Live Webcams */}
        <PanelBox title="LIVE WEBCAMS" icon={Activity} className="h-[30vh] md:h-[25vh] rounded-none border-0">
          <ConvergencePanel />
        </PanelBox>

        {/* Col 4: Predictions */}
        <PanelBox title="PREDICTIONS" icon={Brain} className="h-[30vh] md:h-[25vh] rounded-none border-0">
          <PredictionPanel />
        </PanelBox>
      </AnimatedSection>

      {/* ─── SECTION 3 (15 vh): MarketTicker + Economics ─── */}
      <AnimatedSection
        className="flex flex-col md:flex-row w-full border-b border-cyan-900/30"
        delay={0.3}
      >
        {/* MarketTicker — full width on mobile, 60 % on desktop */}
        <div className="w-full md:w-[60%] h-[10vh] md:h-[15vh] bg-black/70 backdrop-blur-lg flex flex-col overflow-hidden border-r border-cyan-900/30">
          <div className="px-3 py-1 border-b border-cyan-900/30 flex items-center gap-2 shrink-0">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider">
              MARKET TICKER
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <MarketTicker />
          </div>
        </div>

        {/* Economics stats — 40 % */}
        <div className="w-full md:w-[40%] h-[15vh] bg-black/70 backdrop-blur-lg flex flex-col overflow-hidden">
          <div className="px-3 py-1 border-b border-cyan-900/30 flex items-center gap-2 shrink-0">
            <BarChart3 className="w-3 h-3 text-yellow-400" />
            <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider">
              ECONOMIC DATA
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <EconomicsPanel />
          </div>
        </div>
      </AnimatedSection>

      {/* ─── BOTTOM: NewsTicker + StatusFooter ─── */}
      <AnimatedSection delay={0.4}>
        <div className="bg-black/80 backdrop-blur-md border-t border-cyan-900/40">
          <NewsTicker />
        </div>
        <div className="bg-black/90 border-t border-cyan-900/20">
          <StatusFooter />
        </div>
      </AnimatedSection>
    </div>
  );
}
