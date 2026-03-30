"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { SparkAreaChart } from "@tremor/react";
import { Shield, Radio, AlertTriangle, Activity, Grid3X3, X } from "lucide-react";
import type { IntelItem } from "@/types/intel";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import { MarketTicker } from "@/components/dashboard/MarketTicker";

const Globe3D = dynamic(() => import("@/components/dashboard/Globe3D").then((m) => m.Globe3D), { ssr: false });

interface LayoutProps {
  items: IntelItem[];
  variant: string;
}

export function GridOpsLayout({ items, variant }: LayoutProps) {
  const [panels, setPanels] = useState({ p1: true, p2: true, p3: true, p4: true, p5: true, p6: true });

  const criticalItems = useMemo(() => items.filter((i) => i.severity === "critical").slice(0, 3), [items]);
  const recentItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 5),
    [items]
  );

  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    items.forEach((i) => counts[i.severity]++);
    return counts;
  }, [items]);

  const sources = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.source] = (map[i.source] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [items]);

  const categories = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.category] = (map[i.category] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [items]);

  const sparkData = useMemo(() => {
    const buckets: { hour: string; events: number }[] = [];
    const now = Date.now();
    for (let h = 23; h >= 0; h--) {
      const count = items.filter((i) => {
        const age = Math.floor((now - new Date(i.publishedAt).getTime()) / 3600000);
        return age === h;
      }).length;
      buckets.push({ hour: `${h}h`, events: count });
    }
    return buckets.reverse();
  }, [items]);

  const closePanel = (key: keyof typeof panels) => setPanels((p) => ({ ...p, [key]: false }));

  const panelAnim = (i: number) => ({
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { type: "spring" as const, damping: 20, delay: i * 0.08 },
  });

  const PanelHeader = ({ title, icon: Icon, panelKey }: { title: string; icon: typeof Shield; panelKey: keyof typeof panels }) => (
    <div className="px-2 py-1.5 border-b border-cyan-900/30 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-cyan-400" />
        <span className="font-mono text-[8px] font-bold text-cyan-400 tracking-wider">{title}</span>
      </div>
      <button onClick={() => closePanel(panelKey)} className="text-gray-600 hover:text-cyan-400">
        <X className="w-3 h-3" />
      </button>
    </div>
  );

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Globe3D variant={variant as never} />
      </div>

      {/* Top bar */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="absolute top-0 left-0 right-0 z-30 h-10 flex items-center justify-between px-4 bg-black/40 backdrop-blur-md border-b border-cyan-900/40"
      >
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-widest">GRID OPS</span>
        </div>
        <div className="flex items-center gap-3">
          <Radio className="w-3 h-3 text-green-400 animate-pulse" />
          <span className="font-mono text-[9px] text-green-400">LIVE</span>
          <span className="font-mono text-[9px] text-gray-500">{items.length} ITEMS</span>
        </div>
      </motion.div>

      {/* 3x2 Grid of panels */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ top: "48px", bottom: "56px" }}>
        <div className="grid grid-cols-3 grid-rows-2 gap-3 pointer-events-auto" style={{ width: "960px", maxWidth: "95vw" }}>
          {/* Panel 1: Critical Alerts */}
          <AnimatePresence>
            {panels.p1 && (
              <motion.div {...panelAnim(0)} className="bg-black/70 backdrop-blur-lg border border-red-900/40 rounded-lg overflow-hidden h-[200px] flex flex-col">
                <PanelHeader title="CRITICAL ALERTS" icon={AlertTriangle} panelKey="p1" />
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {criticalItems.length > 0 ? criticalItems.map((item) => (
                    <div key={item.id} className="border-l-2 border-red-500 bg-red-950/20 rounded-r px-2 py-1.5">
                      <div className="font-mono text-[9px] text-red-300 line-clamp-2">{item.title}</div>
                      <div className="font-mono text-[7px] text-red-500 mt-0.5">{item.source}</div>
                    </div>
                  )) : (
                    <div className="font-mono text-[9px] text-green-400 text-center mt-6">ALL CLEAR</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Panel 2: Spark Chart */}
          <AnimatePresence>
            {panels.p2 && (
              <motion.div {...panelAnim(1)} className="bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden h-[200px] flex flex-col">
                <PanelHeader title="EVENT RATE" icon={Activity} panelKey="p2" />
                <div className="flex-1 p-3 flex flex-col justify-center">
                  <SparkAreaChart
                    data={sparkData}
                    categories={["events"]}
                    index="hour"
                    colors={["cyan"]}
                    className="h-24 w-full"
                    curveType="monotone"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="font-mono text-[7px] text-gray-500">24H AGO</span>
                    <span className="font-mono text-[7px] text-gray-500">NOW</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Panel 3: Top Sources */}
          <AnimatePresence>
            {panels.p3 && (
              <motion.div {...panelAnim(2)} className="bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden h-[200px] flex flex-col">
                <PanelHeader title="TOP 5 SOURCES" icon={Radio} panelKey="p3" />
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {sources.map(([src, count], idx) => (
                    <div key={src} className="flex items-center gap-2 bg-black/30 rounded px-2 py-1.5">
                      <span className="font-mono text-[9px] text-cyan-500 w-4">{idx + 1}.</span>
                      <span className="font-mono text-[9px] text-gray-300 flex-1 truncate">{src}</span>
                      <span className="font-mono text-[9px] text-cyan-400">{count}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Panel 4: Category Distribution */}
          <AnimatePresence>
            {panels.p4 && (
              <motion.div {...panelAnim(3)} className="bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden h-[200px] flex flex-col">
                <PanelHeader title="CATEGORIES" icon={Shield} panelKey="p4" />
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                  {categories.map(([cat, count]) => {
                    const pct = items.length > 0 ? (count / items.length) * 100 : 0;
                    return (
                      <div key={cat} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[8px] text-gray-400">{CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS]} {cat.toUpperCase()}</span>
                          <span className="font-mono text-[8px] text-cyan-400">{count}</span>
                        </div>
                        <div className="h-1 bg-black/50 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500/60 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Panel 5: Severity Counters */}
          <AnimatePresence>
            {panels.p5 && (
              <motion.div {...panelAnim(4)} className="bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden h-[200px] flex flex-col">
                <PanelHeader title="SEVERITY" icon={AlertTriangle} panelKey="p5" />
                <div className="flex-1 p-3 grid grid-cols-2 gap-2">
                  {(["critical", "high", "medium", "low"] as const).map((sev) => (
                    <div key={sev} className="bg-black/50 border rounded-lg flex flex-col items-center justify-center p-2" style={{ borderColor: SEVERITY_COLORS[sev] + "40" }}>
                      <div className="font-mono text-2xl font-bold" style={{ color: SEVERITY_COLORS[sev] }}>{severityCounts[sev]}</div>
                      <div className="font-mono text-[7px] text-gray-500 uppercase tracking-wider">{sev}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Panel 6: Latest 5 Items */}
          <AnimatePresence>
            {panels.p6 && (
              <motion.div {...panelAnim(5)} className="bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden h-[200px] flex flex-col">
                <PanelHeader title="LATEST INTEL" icon={Radio} panelKey="p6" />
                <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                  {recentItems.map((item) => (
                    <div key={item.id} className="border-l-2 rounded-r-sm bg-black/30 px-2 py-1" style={{ borderLeftColor: SEVERITY_COLORS[item.severity] }}>
                      <div className="font-mono text-[9px] text-gray-200 line-clamp-1">{item.title}</div>
                      <div className="font-mono text-[7px] text-gray-500">{item.source} -- {item.category.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom strip */}
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="absolute bottom-0 left-0 right-0 z-20 h-14 bg-black/60 backdrop-blur-md border-t border-cyan-900/40"
      >
        <MarketTicker />
      </motion.div>
    </div>
  );
}
