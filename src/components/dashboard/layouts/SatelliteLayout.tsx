"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, BarChart } from "@tremor/react";
import { Shield, Radio, AlertTriangle, Activity, Satellite, Globe } from "lucide-react";
import type { IntelItem } from "@/types/intel";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import { IntelCard } from "@/components/dashboard/IntelCard";
import { MarketTicker } from "@/components/dashboard/MarketTicker";

const Globe3D = dynamic(() => import("@/components/dashboard/Globe3D").then((m) => m.Globe3D), { ssr: false });

interface LayoutProps {
  items: IntelItem[];
  variant: string;
}

function buildTimeline(items: IntelItem[]) {
  const buckets: Record<string, { hour: string; events: number }> = {};
  const now = Date.now();
  for (let h = 23; h >= 0; h--) {
    const label = `${h}h`;
    buckets[label] = { hour: label, events: 0 };
  }
  items.forEach((item) => {
    const age = Math.floor((now - new Date(item.publishedAt).getTime()) / 3600000);
    const key = `${Math.min(age, 23)}h`;
    if (buckets[key]) buckets[key].events++;
  });
  return Object.values(buckets).reverse();
}

export function SatelliteLayout({ items, variant }: LayoutProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    [items]
  );

  const timelineData = useMemo(() => buildTimeline(items), [items]);

  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    items.forEach((i) => counts[i.severity]++);
    return counts;
  }, [items]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.category] = (map[i.category] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a).map(([cat, count]) => ({ category: cat.toUpperCase(), count }));
  }, [items]);

  const sources = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.source] = (map[i.source] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [items]);

  const utcTime = new Date().toISOString().slice(11, 19);

  const breakingItems = useMemo(
    () => items.filter((i) => i.severity === "critical" || i.severity === "high").slice(0, 10),
    [items]
  );

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Globe background - slightly smaller, centered */}
      <div className="absolute inset-[5%] z-0">
        <Globe3D variant={variant as never} />
      </div>

      {/* TOP BAR - Breaking news ticker */}
      <motion.div
        initial={{ y: -40 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="absolute top-0 left-0 right-0 z-30 h-10 flex items-center bg-black/60 backdrop-blur-md border-b border-dashed border-cyan-900/40 overflow-hidden"
      >
        <div className="flex items-center gap-2 px-3 shrink-0 border-r border-dashed border-cyan-900/40 h-full">
          <Satellite className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-widest">SIGINT</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <motion.div
            animate={{ x: [0, -2000] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-6 whitespace-nowrap px-4"
          >
            {breakingItems.map((item) => (
              <span key={item.id} className="font-mono text-[10px]">
                <span style={{ color: SEVERITY_COLORS[item.severity] }}>[{item.severity.toUpperCase()}]</span>
                <span className="text-gray-300 ml-2">{item.title}</span>
                <span className="text-gray-600 ml-2">// {item.source}</span>
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* LEFT PANEL - Full feed */}
      <AnimatePresence>
        {leftOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-12 left-0 bottom-20 z-20 w-72 bg-black/70 backdrop-blur-lg border-r border-dashed border-cyan-900/30 overflow-hidden flex flex-col"
          >
            <div className="px-3 py-2 border-b border-dashed border-cyan-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-cyan-400" />
                <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider">FEED // {items.length}</span>
              </div>
              <button onClick={() => setLeftOpen(false)} className="font-mono text-[8px] text-cyan-600 hover:text-cyan-400">HIDE</button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-900 p-1.5 space-y-1">
              {sortedItems.map((item) => (
                <div key={item.id} className="border-l-2 rounded-r-sm" style={{ borderLeftColor: SEVERITY_COLORS[item.severity] }}>
                  <IntelCard item={item} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!leftOpen && (
        <button onClick={() => setLeftOpen(true)} className="absolute top-14 left-2 z-30 bg-black/60 backdrop-blur border border-dashed border-cyan-900/40 rounded p-2 font-mono text-[8px] text-cyan-400 hover:bg-cyan-900/30">
          FEED
        </button>
      )}

      {/* RIGHT PANEL - Metrics + Charts */}
      <AnimatePresence>
        {rightOpen && (
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-12 right-0 bottom-20 z-20 w-72 bg-black/70 backdrop-blur-lg border-l border-dashed border-cyan-900/30 overflow-hidden flex flex-col"
          >
            <div className="px-3 py-2 border-b border-dashed border-cyan-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider">TELEMETRY</span>
              </div>
              <button onClick={() => setRightOpen(false)} className="font-mono text-[8px] text-cyan-600 hover:text-cyan-400">HIDE</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Severity counters */}
              <div className="grid grid-cols-2 gap-2">
                {(["critical", "high", "medium", "low"] as const).map((sev) => (
                  <div key={sev} className="bg-black/50 border border-dashed rounded p-2 text-center" style={{ borderColor: SEVERITY_COLORS[sev] + "40" }}>
                    <div className="font-mono text-lg font-bold" style={{ color: SEVERITY_COLORS[sev] }}>{severityCounts[sev]}</div>
                    <div className="font-mono text-[7px] text-gray-500 uppercase tracking-wider">{sev}</div>
                  </div>
                ))}
              </div>

              {/* Event rate chart */}
              <div className="bg-black/40 border border-dashed border-cyan-900/20 rounded p-2">
                <span className="font-mono text-[8px] text-cyan-600 tracking-wider">EVENT RATE / 24H</span>
                <AreaChart
                  className="h-28 mt-1"
                  data={timelineData}
                  index="hour"
                  categories={["events"]}
                  colors={["cyan"]}
                  showLegend={false}
                  showGridLines={false}
                  showYAxis={false}
                  curveType="monotone"
                />
              </div>

              {/* Category bars */}
              <div className="bg-black/40 border border-dashed border-cyan-900/20 rounded p-2">
                <span className="font-mono text-[8px] text-cyan-600 tracking-wider">CATEGORY DIST</span>
                <BarChart
                  className="h-32 mt-1"
                  data={categoryData}
                  index="category"
                  categories={["count"]}
                  colors={["cyan"]}
                  showLegend={false}
                  showGridLines={false}
                />
              </div>

              {/* Source list */}
              <div>
                <span className="font-mono text-[8px] text-cyan-600 tracking-wider">ACTIVE SOURCES</span>
                <div className="mt-1 space-y-1">
                  {sources.slice(0, 8).map(([src, count]) => (
                    <div key={src} className="flex items-center justify-between bg-black/30 rounded px-2 py-0.5">
                      <span className="font-mono text-[8px] text-gray-400 truncate max-w-[140px]">{src}</span>
                      <span className="font-mono text-[8px] text-cyan-400">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!rightOpen && (
        <button onClick={() => setRightOpen(true)} className="absolute top-14 right-2 z-30 bg-black/60 backdrop-blur border border-dashed border-cyan-900/40 rounded p-2 font-mono text-[8px] text-cyan-400 hover:bg-cyan-900/30">
          METRICS
        </button>
      )}

      {/* BOTTOM BAR */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="absolute bottom-0 left-0 right-0 z-30 h-20 bg-black/60 backdrop-blur-md border-t border-dashed border-cyan-900/40 flex flex-col"
      >
        <div className="h-6 flex items-center justify-between px-4 border-b border-dashed border-cyan-900/20">
          <span className="font-mono text-[8px] text-gray-500">DOWNLINK ACTIVE</span>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[9px] text-cyan-400">{sources.length} SOURCES</span>
            <span className="font-mono text-[9px] text-gray-400">UTC {utcTime}</span>
            <div className="flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-green-400 animate-pulse" />
              <span className="font-mono text-[8px] text-green-400">ONLINE</span>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <MarketTicker />
        </div>
      </motion.div>
    </div>
  );
}
