"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { AreaChart, BarChart } from "@tremor/react";
import { Shield, Radio, AlertTriangle, Activity, Columns3, Folder, Rss } from "lucide-react";
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
  const buckets: Record<string, { hour: string; critical: number; high: number; medium: number }> = {};
  const now = Date.now();
  for (let h = 23; h >= 0; h--) {
    const label = `${h}h`;
    buckets[label] = { hour: label, critical: 0, high: 0, medium: 0 };
  }
  items.forEach((item) => {
    const age = Math.floor((now - new Date(item.publishedAt).getTime()) / 3600000);
    const key = `${Math.min(age, 23)}h`;
    if (buckets[key] && (item.severity === "critical" || item.severity === "high" || item.severity === "medium")) {
      (buckets[key] as unknown as Record<string, number>)[item.severity]++;
    }
  });
  return Object.values(buckets).reverse();
}

export function TriPanelLayout({ items, variant }: LayoutProps) {
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    }).slice(0, 20),
    [items]
  );

  const timelineData = useMemo(() => buildTimeline(items), [items]);

  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    items.forEach((i) => counts[i.severity]++);
    return counts;
  }, [items]);

  const categories = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.category] = (map[i.category] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [items]);

  const categoryBarData = useMemo(() =>
    categories.map(([cat, count]) => ({ category: cat.toUpperCase().slice(0, 8), count })),
    [categories]
  );

  const sources = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.source] = (map[i.source] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [items]);

  const panelAnim = (delay: number, dir: { x?: number }) => ({
    initial: { opacity: 0, y: 30, ...dir },
    animate: { opacity: 1, y: 0, x: 0 },
    transition: { type: "spring" as const, damping: 22, stiffness: 160, delay },
  });

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Globe background */}
      <div className="absolute inset-0 z-0">
        <Globe3D variant={variant as never} />
      </div>

      {/* Top status bar */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="absolute top-0 left-0 right-0 z-30 h-10 flex items-center justify-between px-4 bg-black/40 backdrop-blur-md border-b border-cyan-900/40"
      >
        <div className="flex items-center gap-2">
          <Columns3 className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-widest">TRI-PANEL OPS</span>
        </div>
        <div className="flex items-center gap-4">
          {(["critical", "high", "medium", "low"] as const).map((sev) => (
            <div key={sev} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[sev] }} />
              <span className="font-mono text-[9px]" style={{ color: SEVERITY_COLORS[sev] }}>{severityCounts[sev]}</span>
            </div>
          ))}
          <Radio className="w-3 h-3 text-green-400 animate-pulse" />
          <span className="font-mono text-[9px] text-green-400">LIVE</span>
        </div>
      </motion.div>

      {/* THREE FLOATING PANELS */}
      <div className="absolute top-12 bottom-16 left-0 right-0 z-20 flex items-center justify-center gap-4 px-4">
        {/* LEFT: Feed */}
        <motion.div
          {...panelAnim(0, { x: -60 })}
          className="w-80 h-[80vh] max-h-[calc(100vh-120px)] bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col shadow-[0_0_15px_rgba(0,229,255,0.08)]"
        >
          <div className="px-3 py-2 border-b border-cyan-900/30 flex items-center gap-2">
            <Rss className="w-3 h-3 text-cyan-400" />
            <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider">INTEL FEED</span>
            <span className="font-mono text-[8px] text-gray-500 ml-auto">{sortedItems.length} ITEMS</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-900 p-1.5 space-y-1">
            {sortedItems.map((item) => (
              <div key={item.id} className="border-l-2 rounded-r-sm" style={{ borderLeftColor: SEVERITY_COLORS[item.severity] }}>
                <IntelCard item={item} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* CENTER: Analytics */}
        <motion.div
          {...panelAnim(0.1, {})}
          className="w-80 h-[80vh] max-h-[calc(100vh-120px)] bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col shadow-[0_0_15px_rgba(0,229,255,0.08)]"
        >
          <div className="px-3 py-2 border-b border-cyan-900/30 flex items-center gap-2">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider">ANALYTICS</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-2">
              {(["critical", "high", "medium", "low"] as const).map((sev) => (
                <div key={sev} className="bg-black/50 border rounded-lg p-2 text-center" style={{ borderColor: SEVERITY_COLORS[sev] + "30" }}>
                  <div className="font-mono text-xl font-bold" style={{ color: SEVERITY_COLORS[sev] }}>{severityCounts[sev]}</div>
                  <div className="font-mono text-[7px] text-gray-500 uppercase tracking-wider">{sev}</div>
                </div>
              ))}
            </div>

            {/* Threat timeline */}
            <div className="bg-black/40 border border-cyan-900/20 rounded p-2">
              <span className="font-mono text-[8px] text-cyan-600 tracking-wider">THREAT TIMELINE</span>
              <AreaChart
                className="h-32 mt-1"
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

            {/* Category bars */}
            <div className="bg-black/40 border border-cyan-900/20 rounded p-2">
              <span className="font-mono text-[8px] text-cyan-600 tracking-wider">CATEGORIES</span>
              <BarChart
                className="h-28 mt-1"
                data={categoryBarData}
                index="category"
                categories={["count"]}
                colors={["cyan"]}
                showLegend={false}
                showGridLines={false}
              />
            </div>

            {/* Summary stats */}
            <div className="bg-black/40 border border-cyan-900/20 rounded p-3 space-y-2">
              <span className="font-mono text-[8px] text-cyan-600 tracking-wider">SUMMARY</span>
              <div className="flex justify-between">
                <span className="font-mono text-[9px] text-gray-400">Total Items</span>
                <span className="font-mono text-[9px] text-cyan-400 font-bold">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[9px] text-gray-400">Active Sources</span>
                <span className="font-mono text-[9px] text-cyan-400 font-bold">{sources.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[9px] text-gray-400">Categories</span>
                <span className="font-mono text-[9px] text-cyan-400 font-bold">{categories.length}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT: Categories + Sources */}
        <motion.div
          {...panelAnim(0.2, { x: 60 })}
          className="w-80 h-[80vh] max-h-[calc(100vh-120px)] bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col shadow-[0_0_15px_rgba(0,229,255,0.08)]"
        >
          <div className="px-3 py-2 border-b border-cyan-900/30 flex items-center gap-2">
            <Folder className="w-3 h-3 text-cyan-400" />
            <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider">BREAKDOWN</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Categories */}
            <div>
              <span className="font-mono text-[8px] text-cyan-600 tracking-wider">CATEGORIES</span>
              <div className="mt-2 space-y-1">
                {categories.map(([cat, count]) => {
                  const pct = items.length > 0 ? (count / items.length) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-gray-300">
                          {CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS]} {cat.toUpperCase()}
                        </span>
                        <span className="font-mono text-[9px] text-cyan-400">{count}</span>
                      </div>
                      <div className="h-1.5 bg-black/50 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-cyan-500/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sources */}
            <div>
              <span className="font-mono text-[8px] text-cyan-600 tracking-wider">ACTIVE SOURCES</span>
              <div className="mt-2 space-y-1">
                {sources.map(([src, count]) => (
                  <div key={src} className="flex items-center justify-between bg-black/30 rounded px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="font-mono text-[9px] text-gray-300 truncate max-w-[160px]">{src}</span>
                    </div>
                    <span className="font-mono text-[9px] text-cyan-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Severity breakdown */}
            <div>
              <span className="font-mono text-[8px] text-cyan-600 tracking-wider">SEVERITY BREAKDOWN</span>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {(["critical", "high", "medium", "low", "info"] as const).map((sev) => (
                  <div key={sev} className="bg-black/50 border rounded p-2 text-center" style={{ borderColor: SEVERITY_COLORS[sev] + "30" }}>
                    <div className="font-mono text-sm font-bold" style={{ color: SEVERITY_COLORS[sev] }}>{severityCounts[sev]}</div>
                    <div className="font-mono text-[7px] text-gray-500 uppercase">{sev}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
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
