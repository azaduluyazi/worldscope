"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { AreaChart, BarChart } from "@tremor/react";
import { Radio, Search, Eye } from "lucide-react";
import type { IntelItem } from "@/types/intel";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import { IntelCard } from "@/components/dashboard/IntelCard";

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

export function ReconLayout({ items, variant }: LayoutProps) {
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

  const criticalCount = severityCounts.critical;
  const highCount = severityCounts.high;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Globe background - visible in top 55% */}
      <div className="absolute inset-0 z-0">
        <Globe3D variant={variant as never} />
      </div>

      {/* Top slim nav */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="absolute top-0 left-0 right-0 z-30 h-12 flex items-center justify-between px-4 bg-black/30 backdrop-blur-sm border-b border-cyan-900/20"
      >
        <div className="flex items-center gap-3">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-widest">RECONNAISSANCE DASHBOARD</span>
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
          <span className="font-mono text-[9px] text-gray-500">{items.length} ITEMS</span>
        </div>
      </motion.div>

      {/* BOTTOM PANEL - slides up, 3-column grid */}
      <motion.div
        initial={{ y: 500 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 140 }}
        className="absolute bottom-0 left-0 right-0 z-20 h-[45vh] bg-black/75 backdrop-blur-lg border-t border-cyan-900/40 flex flex-col"
      >
        {/* Panel header */}
        <div className="h-8 flex items-center justify-between px-4 border-b border-cyan-900/30 shrink-0">
          <div className="flex items-center gap-2">
            <Search className="w-3 h-3 text-cyan-400" />
            <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider">RECON DATA MATRIX</span>
          </div>
          <div className="flex items-center gap-4">
            {(["critical", "high", "medium", "low"] as const).map((sev) => (
              <div key={sev} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[sev] }} />
                <span className="font-mono text-[8px]" style={{ color: SEVERITY_COLORS[sev] }}>{severityCounts[sev]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3-column grid */}
        <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden">
          {/* Col 1 - Feed */}
          <div className="border-r border-cyan-900/20 flex flex-col overflow-hidden">
            <div className="px-3 py-1 border-b border-cyan-900/20">
              <span className="font-mono text-[8px] text-cyan-600 tracking-wider">INTEL FEED</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-900 p-1.5 space-y-1">
              {sortedItems.map((item) => (
                <div key={item.id} className="border-l-2 rounded-r-sm" style={{ borderLeftColor: SEVERITY_COLORS[item.severity] }}>
                  <IntelCard item={item} />
                </div>
              ))}
            </div>
          </div>

          {/* Col 2 - Charts */}
          <div className="border-r border-cyan-900/20 flex flex-col overflow-hidden">
            <div className="px-3 py-1 border-b border-cyan-900/20">
              <span className="font-mono text-[8px] text-cyan-600 tracking-wider">SIGNALS ANALYSIS</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="bg-black/40 border border-cyan-900/20 rounded p-2">
                <span className="font-mono text-[7px] text-cyan-700 tracking-wider">THREAT TIMELINE / 24H</span>
                <AreaChart
                  className="h-28 mt-1"
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
              <div className="bg-black/40 border border-cyan-900/20 rounded p-2">
                <span className="font-mono text-[7px] text-cyan-700 tracking-wider">CATEGORY DISTRIBUTION</span>
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
            </div>
          </div>

          {/* Col 3 - Breakdown + Stats */}
          <div className="flex flex-col overflow-hidden">
            <div className="px-3 py-1 border-b border-cyan-900/20">
              <span className="font-mono text-[8px] text-cyan-600 tracking-wider">BREAKDOWN</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Category list */}
              <div>
                <span className="font-mono text-[8px] text-cyan-700 tracking-wider">CATEGORIES</span>
                <div className="mt-1 space-y-1">
                  {categories.map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between bg-black/30 rounded px-2 py-1">
                      <span className="font-mono text-[9px] text-gray-300">
                        {CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] || "?"} {cat.toUpperCase()}
                      </span>
                      <span className="font-mono text-[9px] text-cyan-400">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Severity stats */}
              <div>
                <span className="font-mono text-[8px] text-cyan-700 tracking-wider">SEVERITY STATS</span>
                <div className="mt-1 grid grid-cols-2 gap-1.5">
                  {(["critical", "high", "medium", "low", "info"] as const).map((sev) => (
                    <div key={sev} className="bg-black/50 border rounded p-2 text-center" style={{ borderColor: SEVERITY_COLORS[sev] + "30" }}>
                      <div className="font-mono text-sm font-bold" style={{ color: SEVERITY_COLORS[sev] }}>{severityCounts[sev]}</div>
                      <div className="font-mono text-[7px] text-gray-500 uppercase">{sev}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top sources */}
              <div>
                <span className="font-mono text-[8px] text-cyan-700 tracking-wider">TOP SOURCES</span>
                <div className="mt-1 space-y-1">
                  {sources.slice(0, 6).map(([src, count]) => (
                    <div key={src} className="flex items-center justify-between bg-black/30 rounded px-2 py-0.5">
                      <span className="font-mono text-[8px] text-gray-400 truncate max-w-[120px]">{src}</span>
                      <span className="font-mono text-[8px] text-cyan-400">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
