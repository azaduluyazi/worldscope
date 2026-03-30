"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { AreaChart } from "@tremor/react";
import { Radio, Anchor, Radar } from "lucide-react";
import type { IntelItem } from "@/types/intel";
import { SEVERITY_COLORS } from "@/types/intel";
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

export function CICLayout({ items, variant }: LayoutProps) {
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

  const sources = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.source] = (map[i.source] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [items]);

  const utcTime = new Date().toISOString().slice(11, 19);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Globe background */}
      <div className="absolute inset-0 z-0">
        <Globe3D variant={variant as never} />
      </div>

      {/* Blue tint overlay for naval aesthetic */}
      <div className="absolute inset-0 z-[1] bg-blue-950/20 pointer-events-none" />

      {/* Top bar - CIC header */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="absolute top-0 left-0 right-0 z-30 h-11 flex items-center justify-between px-4 bg-black/50 backdrop-blur-md border-b border-blue-800/40"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <Radar className="w-5 h-5 text-blue-400" />
          </motion.div>
          <span className="font-mono text-[10px] font-bold text-blue-300 tracking-widest">
            CIC -- COMBAT INFORMATION CENTER
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px] text-gray-400">UTC {utcTime}</span>
          <Anchor className="w-3.5 h-3.5 text-blue-400" />
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-green-400 animate-pulse" />
            <span className="font-mono text-[10px] text-green-400">ACTIVE</span>
          </div>
        </div>
      </motion.div>

      {/* BOTTOM HALF - Large panel covering 50% */}
      <motion.div
        initial={{ y: 600 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 140 }}
        className="absolute bottom-0 left-0 right-0 z-20 h-[50vh] bg-black/75 backdrop-blur-lg border-t border-blue-800/40 flex flex-col"
      >
        {/* Panel header */}
        <div className="h-8 flex items-center justify-between px-4 border-b border-blue-800/30 shrink-0">
          <span className="font-mono text-[9px] font-bold text-blue-300 tracking-wider">SITUATION DISPLAY</span>
          <div className="flex items-center gap-4">
            {(["critical", "high", "medium", "low"] as const).map((sev) => (
              <div key={sev} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[sev] }} />
                <span className="font-mono text-[8px]" style={{ color: SEVERITY_COLORS[sev] }}>{severityCounts[sev]} {sev.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4-column layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Col 1: Severity sidebar */}
          <div className="w-16 border-r border-blue-900/30 p-2 flex flex-col gap-2">
            {(["critical", "high", "medium", "low", "info"] as const).map((sev) => (
              <div key={sev} className="flex flex-col items-center py-1.5">
                <span className={`w-3 h-3 rounded-full ${sev === "critical" ? "animate-pulse" : ""}`} style={{ backgroundColor: SEVERITY_COLORS[sev] }} />
                <span className="font-mono text-[10px] font-bold mt-1" style={{ color: SEVERITY_COLORS[sev] }}>{severityCounts[sev]}</span>
                <span className="font-mono text-[6px] text-gray-600 uppercase">{sev.slice(0, 4)}</span>
              </div>
            ))}
          </div>

          {/* Col 2: Feed - naval style */}
          <div className="flex-1 border-r border-blue-900/30 flex flex-col overflow-hidden">
            <div className="px-3 py-1 border-b border-blue-900/20">
              <span className="font-mono text-[8px] text-blue-400 tracking-wider">INTEL STREAM</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-900 p-2 space-y-0">
              {sortedItems.map((item) => (
                <div key={item.id} className="py-1.5 border-b border-blue-900/15">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: SEVERITY_COLORS[item.severity] }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[9px] text-gray-200 line-clamp-1">{item.title}</div>
                      <div className="font-mono text-[7px] text-gray-500 mt-0.5">
                        {`${item.source} // ${item.category.toUpperCase()} // ${new Date(item.publishedAt).toISOString().slice(11, 16)} UTC`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Col 3: Area chart */}
          <div className="w-72 border-r border-blue-900/30 flex flex-col overflow-hidden">
            <div className="px-3 py-1 border-b border-blue-900/20">
              <span className="font-mono text-[8px] text-blue-400 tracking-wider">THREAT ANALYSIS</span>
            </div>
            <div className="flex-1 p-3 flex flex-col justify-center">
              <AreaChart
                className="h-44"
                data={timelineData}
                index="hour"
                categories={["critical", "high", "medium"]}
                colors={["rose", "amber", "blue"]}
                showLegend={false}
                showGridLines={false}
                showYAxis={false}
                curveType="monotone"
              />
              <div className="flex justify-between mt-1">
                <span className="font-mono text-[7px] text-gray-600">24H AGO</span>
                <span className="font-mono text-[7px] text-gray-600">NOW</span>
              </div>
            </div>
          </div>

          {/* Col 4: Source list + stats */}
          <div className="w-52 flex flex-col overflow-hidden">
            <div className="px-3 py-1 border-b border-blue-900/20">
              <span className="font-mono text-[8px] text-blue-400 tracking-wider">SOURCES</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sources.map(([src, count]) => (
                <div key={src} className="flex items-center justify-between bg-black/30 rounded px-2 py-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="font-mono text-[8px] text-gray-300 truncate max-w-[100px]">{src}</span>
                  </div>
                  <span className="font-mono text-[8px] text-blue-400">{count}</span>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-blue-900/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[7px] text-gray-500">TOTAL SOURCES</span>
                <span className="font-mono text-[8px] text-blue-400">{sources.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[7px] text-gray-500">TOTAL ITEMS</span>
                <span className="font-mono text-[8px] text-blue-400">{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[7px] text-gray-500">STATUS</span>
                <span className="font-mono text-[8px] text-green-400">OPERATIONAL</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
