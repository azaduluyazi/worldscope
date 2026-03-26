"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, BarChart } from "@tremor/react";
import { Shield, Radio, AlertTriangle, Activity, Building2, ChevronRight } from "lucide-react";
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

export function PentagonLayout({ items, variant }: LayoutProps) {
  const [activeTab, setActiveTab] = useState<"intel" | "analysis">("intel");
  const [panelOpen, setPanelOpen] = useState(true);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    }),
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
        className="absolute top-0 left-0 right-0 z-30 h-11 flex items-center justify-between px-4 bg-black/50 backdrop-blur-md border-b border-cyan-900/40"
      >
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-widest">PENTAGON BRIEFING</span>
        </div>
        <div className="flex items-center gap-5">
          {(["critical", "high", "medium", "low"] as const).map((sev) => (
            <div key={sev} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${sev === "critical" ? "animate-pulse" : ""}`} style={{ backgroundColor: SEVERITY_COLORS[sev] }} />
              <span className="font-mono text-[10px]" style={{ color: SEVERITY_COLORS[sev] }}>
                {severityCounts[sev]} {sev.toUpperCase()}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-green-400 animate-pulse" />
            <span className="font-mono text-[10px] text-green-400">LIVE</span>
          </div>
        </div>
      </motion.div>

      {/* LEFT PANEL - Tabbed interface */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ x: -520 }}
            animate={{ x: 0 }}
            exit={{ x: -520 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="absolute top-13 left-2 bottom-16 z-20 w-[500px] bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col"
          >
            {/* Tabs */}
            <div className="flex border-b border-cyan-900/30">
              {(["intel", "analysis"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 font-mono text-[10px] font-bold tracking-wider transition-colors ${
                    activeTab === tab
                      ? "text-cyan-400 bg-cyan-900/20 border-b-2 border-cyan-400"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab === "intel" ? "INTEL FEED" : "ANALYSIS"}
                </button>
              ))}
              <button onClick={() => setPanelOpen(false)} className="px-3 font-mono text-[9px] text-cyan-600 hover:text-cyan-400 border-l border-cyan-900/30">
                HIDE
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "intel" ? (
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-900 p-2 space-y-1">
                  {sortedItems.map((item) => (
                    <div key={item.id} className="border-l-2 rounded-r-sm" style={{ borderLeftColor: SEVERITY_COLORS[item.severity] }}>
                      <IntelCard item={item} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-4 space-y-4">
                  {/* KPI row */}
                  <div className="grid grid-cols-5 gap-2">
                    {(["critical", "high", "medium", "low", "info"] as const).map((sev) => (
                      <div key={sev} className="bg-black/50 border rounded p-2 text-center" style={{ borderColor: SEVERITY_COLORS[sev] + "40" }}>
                        <div className="font-mono text-xl font-bold" style={{ color: SEVERITY_COLORS[sev] }}>{severityCounts[sev]}</div>
                        <div className="font-mono text-[7px] text-gray-500 uppercase tracking-wider">{sev}</div>
                      </div>
                    ))}
                  </div>

                  {/* Threat timeline */}
                  <div className="bg-black/40 border border-cyan-900/20 rounded p-3">
                    <span className="font-mono text-[8px] text-cyan-600 tracking-wider">THREAT TIMELINE / 24H</span>
                    <AreaChart
                      className="h-36 mt-2"
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

                  {/* Category chart */}
                  <div className="bg-black/40 border border-cyan-900/20 rounded p-3">
                    <span className="font-mono text-[8px] text-cyan-600 tracking-wider">CATEGORY DISTRIBUTION</span>
                    <BarChart
                      className="h-32 mt-2"
                      data={categoryBarData}
                      index="category"
                      categories={["count"]}
                      colors={["cyan"]}
                      showLegend={false}
                      showGridLines={false}
                    />
                  </div>

                  {/* Sources + Categories list */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-mono text-[8px] text-cyan-600 tracking-wider">TOP SOURCES</span>
                      <div className="mt-1 space-y-1">
                        {sources.slice(0, 8).map(([src, count]) => (
                          <div key={src} className="flex items-center justify-between bg-black/30 rounded px-2 py-0.5">
                            <span className="font-mono text-[8px] text-gray-400 truncate max-w-[140px]">{src}</span>
                            <span className="font-mono text-[8px] text-cyan-400">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-mono text-[8px] text-cyan-600 tracking-wider">CATEGORIES</span>
                      <div className="mt-1 space-y-1">
                        {categories.map(([cat, count]) => (
                          <div key={cat} className="flex items-center justify-between bg-black/30 rounded px-2 py-0.5">
                            <span className="font-mono text-[8px] text-gray-300">
                              {CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS]} {cat.toUpperCase()}
                            </span>
                            <span className="font-mono text-[8px] text-cyan-400">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!panelOpen && (
        <button onClick={() => setPanelOpen(true)} className="absolute top-16 left-2 z-30 bg-black/60 backdrop-blur border border-cyan-900/40 rounded p-2 font-mono text-[9px] text-cyan-400 hover:bg-cyan-900/30 flex items-center gap-1">
          <ChevronRight className="w-3 h-3" /> BRIEFING
        </button>
      )}

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
