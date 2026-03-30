"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Radio, AlertTriangle, Activity, Crosshair, Wifi } from "lucide-react";
import type { IntelItem } from "@/types/intel";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import { MarketTicker } from "@/components/dashboard/MarketTicker";

const Globe3D = dynamic(() => import("@/components/dashboard/Globe3D").then((m) => m.Globe3D), { ssr: false });

interface LayoutProps {
  items: IntelItem[];
  variant: string;
}

const THREAT_LEVELS = ["LOW", "GUARDED", "ELEVATED", "HIGH", "SEVERE"] as const;

export function WarRoomLayout({ items, variant }: LayoutProps) {
  const [visiblePanels, setVisiblePanels] = useState({ tl: true, tr: true, bl: true, br: true });

  const criticalItems = useMemo(() => items.filter((i) => i.severity === "critical"), [items]);
  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    items.forEach((i) => counts[i.severity]++);
    return counts;
  }, [items]);

  const threatLevel = useMemo(() => {
    if (severityCounts.critical > 5) return 4;
    if (severityCounts.critical > 2) return 3;
    if (severityCounts.high > 5) return 2;
    if (severityCounts.high > 0) return 1;
    return 0;
  }, [severityCounts]);

  const sources = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.source] = (map[i.source] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [items]);

  const categories = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.category] = (map[i.category] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [items]);

  const recentItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 12),
    [items]
  );

  const utcTime = new Date().toISOString().slice(11, 19);

  const panelAnim = (dir: { x?: number; y?: number }) => ({
    initial: { opacity: 0, ...dir },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, ...dir },
    transition: { type: "spring" as const, damping: 22, stiffness: 180 },
  });

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Globe3D variant={variant as never} />
      </div>

      {/* Top status bar */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="absolute top-0 left-0 right-0 z-30 h-10 flex items-center justify-between px-4 bg-black/50 backdrop-blur-md border-b border-cyan-900/40"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-widest">WAR ROOM</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-gray-400">UTC {utcTime}</span>
          <span className="font-mono text-[10px] text-cyan-400">{sources.length} SOURCES ACTIVE</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${threatLevel >= 3 ? "bg-red-500 animate-pulse" : threatLevel >= 2 ? "bg-yellow-400" : "bg-green-400"}`} />
            <span className={`font-mono text-[10px] ${threatLevel >= 3 ? "text-red-400" : threatLevel >= 2 ? "text-yellow-400" : "text-green-400"}`}>
              THREAT: {THREAT_LEVELS[threatLevel]}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Center floating threat indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="flex flex-col items-center"
        >
          <Crosshair className="w-12 h-12 text-cyan-500/30" />
          <span className="font-mono text-[9px] text-cyan-500/50 tracking-widest mt-1">TARGETING</span>
        </motion.div>
      </div>

      {/* TOP LEFT - Critical Alerts */}
      <AnimatePresence>
        {visiblePanels.tl && (
          <motion.div {...panelAnim({ x: -100, y: -100 })}
            className="absolute top-12 left-2 z-20 w-[280px] h-[280px] bg-black/70 backdrop-blur-lg border border-red-900/50 rounded-lg overflow-hidden flex flex-col"
          >
            <div className="px-3 py-1.5 border-b border-red-900/40 flex items-center justify-between bg-red-950/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />
                <span className="font-mono text-[9px] font-bold text-red-400 tracking-wider">CRITICAL ALERTS</span>
              </div>
              <button onClick={() => setVisiblePanels((p) => ({ ...p, tl: false }))} className="font-mono text-[8px] text-red-600 hover:text-red-400">X</button>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {criticalItems.slice(0, 8).map((item) => (
                <div key={item.id} className="border-l-2 border-red-500 bg-red-950/20 rounded-r px-2 py-1">
                  <div className="font-mono text-[9px] text-red-300 line-clamp-2">{item.title}</div>
                  <div className="font-mono text-[7px] text-red-500 mt-0.5">{item.source} -- {new Date(item.publishedAt).toISOString().slice(11, 16)} UTC</div>
                </div>
              ))}
              {criticalItems.length === 0 && (
                <div className="font-mono text-[9px] text-green-400 text-center mt-8">NO CRITICAL ALERTS</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP RIGHT - Source Status */}
      <AnimatePresence>
        {visiblePanels.tr && (
          <motion.div {...panelAnim({ x: 100, y: -100 })}
            className="absolute top-12 right-2 z-20 w-[280px] h-[280px] bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col"
          >
            <div className="px-3 py-1.5 border-b border-cyan-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-3 h-3 text-cyan-400" />
                <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider">SOURCE STATUS</span>
              </div>
              <button onClick={() => setVisiblePanels((p) => ({ ...p, tr: false }))} className="font-mono text-[8px] text-cyan-600 hover:text-cyan-400">X</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sources.map(([source, count]) => (
                <div key={source} className="flex items-center justify-between bg-black/30 rounded px-2 py-1">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-2.5 h-2.5 text-green-400" />
                    <span className="font-mono text-[9px] text-gray-300 truncate max-w-[160px]">{source.toUpperCase()}</span>
                  </div>
                  <span className="font-mono text-[9px] text-cyan-400">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM LEFT - Category Radar */}
      <AnimatePresence>
        {visiblePanels.bl && (
          <motion.div {...panelAnim({ x: -100, y: 100 })}
            className="absolute bottom-16 left-2 z-20 w-[280px] h-[280px] bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col"
          >
            <div className="px-3 py-1.5 border-b border-cyan-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider">CATEGORY RADAR</span>
              </div>
              <button onClick={() => setVisiblePanels((p) => ({ ...p, bl: false }))} className="font-mono text-[8px] text-cyan-600 hover:text-cyan-400">X</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {categories.map(([cat, count]) => {
                const pct = items.length > 0 ? (count / items.length) * 100 : 0;
                return (
                  <div key={cat} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8px] text-gray-400">{CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] || "?"} {cat.toUpperCase()}</span>
                      <span className="font-mono text-[8px] text-cyan-400">{count}</span>
                    </div>
                    <div className="h-1 bg-black/50 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500/70 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM RIGHT - Recent Feed */}
      <AnimatePresence>
        {visiblePanels.br && (
          <motion.div {...panelAnim({ x: 100, y: 100 })}
            className="absolute bottom-16 right-2 z-20 w-[280px] h-[280px] bg-black/70 backdrop-blur-lg border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col"
          >
            <div className="px-3 py-1.5 border-b border-cyan-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-3 h-3 text-green-400 animate-pulse" />
                <span className="font-mono text-[9px] font-bold text-cyan-400 tracking-wider">RECENT FEED</span>
              </div>
              <button onClick={() => setVisiblePanels((p) => ({ ...p, br: false }))} className="font-mono text-[8px] text-cyan-600 hover:text-cyan-400">X</button>
            </div>
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
