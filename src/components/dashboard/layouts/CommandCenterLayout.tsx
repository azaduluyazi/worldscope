"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart } from "@tremor/react";
import { Shield, Radio, AlertTriangle, Activity } from "lucide-react";
import type { IntelItem } from "@/types/intel";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import { IntelCard } from "@/components/dashboard/IntelCard";
import { MarketTicker } from "@/components/dashboard/MarketTicker";

const Globe3D = dynamic(() => import("@/components/dashboard/Globe3D").then((m) => m.Globe3D), { ssr: false });

interface LayoutProps {
  items: IntelItem[];
  variant: string;
}

function buildThreatTimeline(items: IntelItem[]) {
  const buckets: Record<string, { hour: string; critical: number; high: number; medium: number; low: number }> = {};
  const now = Date.now();
  for (let h = 23; h >= 0; h--) {
    const label = `${h}h ago`;
    buckets[label] = { hour: label, critical: 0, high: 0, medium: 0, low: 0 };
  }
  items.forEach((item) => {
    const age = Math.floor((now - new Date(item.publishedAt).getTime()) / 3600000);
    const key = `${Math.min(age, 23)}h ago`;
    if (buckets[key] && item.severity in buckets[key]) {
      (buckets[key] as unknown as Record<string, number>)[item.severity]++;
    }
  });
  return Object.values(buckets).reverse();
}

export function CommandCenterLayout({ items, variant }: LayoutProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const criticalCount = useMemo(() => items.filter((i) => i.severity === "critical").length, [items]);
  const highCount = useMemo(() => items.filter((i) => i.severity === "high").length, [items]);
  const timelineData = useMemo(() => buildThreatTimeline(items), [items]);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
      }),
    [items]
  );

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Globe - Full screen background */}
      <div className="absolute inset-0 z-0">
        <Globe3D variant={variant as never} />
      </div>

      {/* Top nav bar - transparent overlay */}
      <motion.div
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="absolute top-0 left-0 right-0 z-30 h-12 flex items-center justify-between px-4 bg-black/40 backdrop-blur-md border-b border-cyan-900/40"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="font-mono text-xs font-bold text-cyan-400 tracking-widest">
            WORLDSCOPE COMMAND CENTER
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-[10px] text-red-400">{criticalCount} CRITICAL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="font-mono text-[10px] text-yellow-400">{highCount} HIGH</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-green-400 animate-pulse" />
            <span className="font-mono text-[10px] text-green-400">LIVE</span>
          </div>
        </div>
      </motion.div>

      {/* Left panel - Intel Feed */}
      <AnimatePresence>
        {leftOpen && (
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-14 left-2 bottom-16 z-20 w-80 lg:w-96 bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col"
          >
            <div className="px-3 py-2 border-b border-cyan-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-wider">
                  INTEL FEED — {items.length} ITEMS
                </span>
              </div>
              <button
                onClick={() => setLeftOpen(false)}
                className="font-mono text-[9px] text-cyan-600 hover:text-cyan-400"
              >
                HIDE
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-900 p-1.5 space-y-1">
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  className="border-l-2 rounded-r-sm"
                  style={{ borderLeftColor: SEVERITY_COLORS[item.severity] }}
                >
                  <IntelCard item={item} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle buttons when panels hidden */}
      {!leftOpen && (
        <button
          onClick={() => setLeftOpen(true)}
          className="absolute top-16 left-2 z-30 bg-black/60 backdrop-blur border border-cyan-900/40 rounded p-2 font-mono text-[9px] text-cyan-400 hover:bg-cyan-900/30"
        >
          FEED
        </button>
      )}

      {/* Right panel - Metrics */}
      <AnimatePresence>
        {rightOpen && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-14 right-2 bottom-16 z-20 w-80 lg:w-96 bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col"
          >
            <div className="px-3 py-2 border-b border-cyan-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-wider">
                  THREAT TIMELINE
                </span>
              </div>
              <button
                onClick={() => setRightOpen(false)}
                className="font-mono text-[9px] text-cyan-600 hover:text-cyan-400"
              >
                HIDE
              </button>
            </div>
            <div className="p-3 flex-1 overflow-y-auto">
              {/* Severity breakdown counters */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {(["critical", "high", "medium", "low"] as const).map((sev) => (
                  <div
                    key={sev}
                    className="bg-black/50 border rounded p-2 text-center"
                    style={{ borderColor: SEVERITY_COLORS[sev] + "40" }}
                  >
                    <div className="font-mono text-lg font-bold" style={{ color: SEVERITY_COLORS[sev] }}>
                      {items.filter((i) => i.severity === sev).length}
                    </div>
                    <div className="font-mono text-[7px] text-gray-500 uppercase">{sev}</div>
                  </div>
                ))}
              </div>

              {/* Tremor AreaChart */}
              <div className="bg-black/40 border border-cyan-900/20 rounded p-2">
                <AreaChart
                  className="h-40"
                  data={timelineData}
                  index="hour"
                  categories={["critical", "high", "medium"]}
                  colors={["rose", "amber", "cyan"]}
                  showLegend={false}
                  showGridLines={false}
                  showYAxis={false}
                  curveType="monotone"
                />
              </div>

              {/* Category breakdown */}
              <div className="mt-4 space-y-1">
                <span className="font-mono text-[9px] text-cyan-600 tracking-wider">CATEGORY BREAKDOWN</span>
                {Object.entries(
                  items.reduce(
                    (acc, item) => {
                      acc[item.category] = (acc[item.category] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  )
                )
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between bg-black/30 rounded px-2 py-1">
                      <span className="font-mono text-[10px] text-gray-300">
                        {CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] || "?"} {cat.toUpperCase()}
                      </span>
                      <span className="font-mono text-[10px] text-cyan-400">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!rightOpen && (
        <button
          onClick={() => setRightOpen(true)}
          className="absolute top-16 right-2 z-30 bg-black/60 backdrop-blur border border-cyan-900/40 rounded p-2 font-mono text-[9px] text-cyan-400 hover:bg-cyan-900/30"
        >
          METRICS
        </button>
      )}

      {/* Bottom strip - market ticker + status */}
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="absolute bottom-0 left-0 right-0 z-20 h-14 bg-black/60 backdrop-blur-md border-t border-cyan-900/40"
      >
        <MarketTicker />
      </motion.div>

      {/* Mobile: stack vertically */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .absolute.top-14.left-2, .absolute.top-14.right-2 {
            position: relative !important;
            top: auto !important; left: auto !important; right: auto !important;
            bottom: auto !important; width: 100% !important;
            height: 50vh !important;
          }
        }
      `}</style>
    </div>
  );
}
