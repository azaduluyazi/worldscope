"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { SparkAreaChart } from "@tremor/react";
import { Shield, Radio, AlertTriangle, Activity, Orbit, Zap } from "lucide-react";
import type { IntelItem } from "@/types/intel";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import { MarketTicker } from "@/components/dashboard/MarketTicker";

const Globe3D = dynamic(() => import("@/components/dashboard/Globe3D").then((m) => m.Globe3D), { ssr: false });

interface LayoutProps {
  items: IntelItem[];
  variant: string;
}

export function OrbitalLayout({ items, variant }: LayoutProps) {
  const breakingItems = useMemo(
    () => items.filter((i) => i.severity === "critical" || i.severity === "high").slice(0, 5),
    [items]
  );

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
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 6);
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

  const panelAnim = (delay: number) => ({
    initial: { opacity: 0, scale: 0.7 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring" as const, damping: 18, stiffness: 140, delay },
  });

  // Center of viewport for SVG lines
  const cx = "50%";
  const cy = "50%";

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Globe background */}
      <div className="absolute inset-0 z-0">
        <Globe3D variant={variant as never} />
      </div>

      {/* Top thin nav */}
      <motion.div
        initial={{ y: -40 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="absolute top-0 left-0 right-0 z-30 h-10 flex items-center justify-between px-4 bg-black/30 backdrop-blur-sm border-b border-cyan-900/20"
      >
        <div className="flex items-center gap-2">
          <Orbit className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-widest">ORBITAL VIEW</span>
        </div>
        <div className="flex items-center gap-3">
          <Radio className="w-3 h-3 text-green-400 animate-pulse" />
          <span className="font-mono text-[9px] text-green-400">TRACKING</span>
          <span className="font-mono text-[9px] text-gray-500">{items.length} OBJECTS</span>
        </div>
      </motion.div>

      {/* SVG connecting lines */}
      <svg className="absolute inset-0 z-[5] pointer-events-none w-full h-full">
        {/* Lines from center to panel positions */}
        <line x1="50%" y1="50%" x2="50%" y2="14%" stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="50%" y1="50%" x2="82%" y2="40%" stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="50%" y1="50%" x2="78%" y2="72%" stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="50%" y1="50%" x2="22%" y2="72%" stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="50%" y1="50%" x2="18%" y2="40%" stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
        {/* Center dot */}
        <circle cx="50%" cy="50%" r="4" fill="rgba(0,229,255,0.3)" />
        <circle cx="50%" cy="50%" r="2" fill="rgba(0,229,255,0.6)" />
      </svg>

      {/* 12 o'clock: Breaking Alerts */}
      <motion.div
        {...panelAnim(0)}
        className="absolute z-20 w-72 h-48 bg-black/70 backdrop-blur-lg border border-red-900/40 rounded-lg overflow-hidden flex flex-col"
        style={{ top: "6%", left: "50%", transform: "translateX(-50%)" }}
      >
        <div className="px-3 py-1.5 border-b border-red-900/30 flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />
          <span className="font-mono text-[8px] font-bold text-red-400 tracking-wider">BREAKING ALERTS</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {breakingItems.length > 0 ? breakingItems.map((item) => (
            <div key={item.id} className="border-l-2 bg-black/30 rounded-r px-2 py-1" style={{ borderLeftColor: SEVERITY_COLORS[item.severity] }}>
              <div className="font-mono text-[9px] text-gray-200 line-clamp-1">{item.title}</div>
              <div className="font-mono text-[7px] text-gray-500">{item.source}</div>
            </div>
          )) : (
            <div className="font-mono text-[9px] text-green-400 text-center mt-6">NO ALERTS</div>
          )}
        </div>
      </motion.div>

      {/* 3 o'clock: Source Stats */}
      <motion.div
        {...panelAnim(0.1)}
        className="absolute z-20 w-48 h-56 bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col"
        style={{ top: "28%", right: "6%" }}
      >
        <div className="px-3 py-1.5 border-b border-cyan-900/30 flex items-center gap-2">
          <Radio className="w-3 h-3 text-cyan-400" />
          <span className="font-mono text-[8px] font-bold text-cyan-400 tracking-wider">SOURCES</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sources.map(([src, count]) => (
            <div key={src} className="flex items-center justify-between bg-black/30 rounded px-2 py-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="font-mono text-[8px] text-gray-300 truncate max-w-[80px]">{src}</span>
              </div>
              <span className="font-mono text-[8px] text-cyan-400">{count}</span>
            </div>
          ))}
        </div>
        <div className="px-3 py-1.5 border-t border-cyan-900/20 text-center">
          <span className="font-mono text-[8px] text-gray-500">{sources.length} ACTIVE</span>
        </div>
      </motion.div>

      {/* 5 o'clock: Severity Counters */}
      <motion.div
        {...panelAnim(0.2)}
        className="absolute z-20 w-56 h-40 bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col"
        style={{ bottom: "16%", right: "12%" }}
      >
        <div className="px-3 py-1.5 border-b border-cyan-900/30 flex items-center gap-2">
          <Shield className="w-3 h-3 text-cyan-400" />
          <span className="font-mono text-[8px] font-bold text-cyan-400 tracking-wider">SEVERITY</span>
        </div>
        <div className="flex-1 p-2 grid grid-cols-3 gap-1.5">
          {(["critical", "high", "medium", "low", "info"] as const).map((sev) => (
            <div key={sev} className="bg-black/50 border rounded flex flex-col items-center justify-center p-1" style={{ borderColor: SEVERITY_COLORS[sev] + "30" }}>
              <div className="font-mono text-sm font-bold" style={{ color: SEVERITY_COLORS[sev] }}>{severityCounts[sev]}</div>
              <div className="font-mono text-[6px] text-gray-500 uppercase">{sev.slice(0, 4)}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 7 o'clock: Spark Chart */}
      <motion.div
        {...panelAnim(0.3)}
        className="absolute z-20 w-56 h-44 bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col"
        style={{ bottom: "16%", left: "12%" }}
      >
        <div className="px-3 py-1.5 border-b border-cyan-900/30 flex items-center gap-2">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span className="font-mono text-[8px] font-bold text-cyan-400 tracking-wider">EVENT RATE</span>
        </div>
        <div className="flex-1 p-3 flex flex-col justify-center">
          <SparkAreaChart
            data={sparkData}
            categories={["events"]}
            index="hour"
            colors={["cyan"]}
            className="h-20 w-full"
            curveType="monotone"
          />
          <div className="flex justify-between mt-2">
            <span className="font-mono text-[7px] text-gray-600">24H AGO</span>
            <span className="font-mono text-[7px] text-gray-600">NOW</span>
          </div>
        </div>
      </motion.div>

      {/* 9 o'clock: Latest 5 Items */}
      <motion.div
        {...panelAnim(0.4)}
        className="absolute z-20 w-48 h-56 bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col"
        style={{ top: "28%", left: "6%" }}
      >
        <div className="px-3 py-1.5 border-b border-cyan-900/30 flex items-center gap-2">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span className="font-mono text-[8px] font-bold text-cyan-400 tracking-wider">LATEST</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {recentItems.map((item) => (
            <div key={item.id} className="border-l-2 bg-black/30 rounded-r px-2 py-1" style={{ borderLeftColor: SEVERITY_COLORS[item.severity] }}>
              <div className="font-mono text-[8px] text-gray-200 line-clamp-2">{item.title}</div>
              <div className="font-mono text-[6px] text-gray-500 mt-0.5">{item.source} // {item.category.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </motion.div>

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
