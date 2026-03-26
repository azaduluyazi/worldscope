"use client";

import { useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Shield, Radio, AlertTriangle, Activity, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import type { IntelItem } from "@/types/intel";
import { SEVERITY_COLORS, CATEGORY_ICONS } from "@/types/intel";
import { MarketTicker } from "@/components/dashboard/MarketTicker";

const Globe3D = dynamic(() => import("@/components/dashboard/Globe3D").then((m) => m.Globe3D), { ssr: false });

interface LayoutProps {
  items: IntelItem[];
  variant: string;
}

export function HorizonLayout({ items, variant }: LayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    }),
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
    return Object.entries(map);
  }, [items]);

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Globe background */}
      <div className="absolute inset-0 z-0">
        <Globe3D variant={variant as never} />
      </div>

      {/* Top mini nav */}
      <motion.div
        initial={{ y: -40 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="absolute top-0 left-0 right-0 z-30 h-10 flex items-center justify-between px-4 bg-black/30 backdrop-blur-sm border-b border-cyan-900/20"
      >
        <div className="flex items-center gap-3">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-[10px] font-bold text-cyan-400 tracking-widest">HORIZON VIEW</span>
        </div>
        <div className="flex items-center gap-4">
          <Radio className="w-3 h-3 text-green-400 animate-pulse" />
          <span className="font-mono text-[9px] text-green-400">LIVE</span>
        </div>
      </motion.div>

      {/* Status bar - between globe and feed panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute left-0 right-0 z-20 h-8 flex items-center justify-between px-4 bg-black/60 backdrop-blur-md border-y border-cyan-900/30"
        style={{ top: "60%" }}
      >
        <div className="flex items-center gap-6">
          {(["critical", "high", "medium", "low", "info"] as const).map((sev) => (
            <div key={sev} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${sev === "critical" ? "animate-pulse" : ""}`} style={{ backgroundColor: SEVERITY_COLORS[sev] }} />
              <span className="font-mono text-[9px]" style={{ color: SEVERITY_COLORS[sev] }}>
                {severityCounts[sev]} {sev.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px] text-gray-500">{items.length} TOTAL ITEMS</span>
          <span className="font-mono text-[9px] text-gray-500">{sources.length} SOURCES</span>
          {/* Scroll controls */}
          <div className="flex items-center gap-1">
            <button onClick={scrollLeft} className="p-0.5 text-cyan-600 hover:text-cyan-400">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={scrollRight} className="p-0.5 text-cyan-600 hover:text-cyan-400">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* BOTTOM 40% - Horizontal scroll feed */}
      <motion.div
        initial={{ y: 400 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 150 }}
        className="absolute left-0 right-0 bottom-0 z-20 bg-black/75 backdrop-blur-lg border-t border-cyan-900/40"
        style={{ top: "calc(60% + 32px)" }}
      >
        <div
          ref={scrollRef}
          className="h-full overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-cyan-900 flex gap-3 px-3 py-3"
        >
          {sortedItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, type: "spring", damping: 20 }}
              className="shrink-0 w-[280px] h-full bg-black/50 border border-cyan-900/30 rounded-lg overflow-hidden flex flex-col"
              style={{ borderTopColor: SEVERITY_COLORS[item.severity], borderTopWidth: "3px" }}
            >
              {/* Card header */}
              <div className="px-3 py-2 border-b border-cyan-900/20 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[item.severity] }} />
                  <span className="font-mono text-[8px] tracking-wider" style={{ color: SEVERITY_COLORS[item.severity] }}>
                    {item.severity.toUpperCase()}
                  </span>
                </div>
                <span className="font-mono text-[8px] text-gray-500">
                  {CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS]} {item.category.toUpperCase()}
                </span>
              </div>

              {/* Card body */}
              <div className="flex-1 px-3 py-2 overflow-hidden">
                <h3 className="font-mono text-[11px] text-gray-100 font-bold leading-tight line-clamp-3">{item.title}</h3>
                <p className="font-mono text-[9px] text-gray-400 mt-2 line-clamp-4">{item.summary}</p>
              </div>

              {/* Card footer */}
              <div className="px-3 py-1.5 border-t border-cyan-900/20 flex items-center justify-between">
                <span className="font-mono text-[7px] text-gray-500 truncate max-w-[140px]">{item.source}</span>
                <span className="font-mono text-[7px] text-gray-600">
                  {new Date(item.publishedAt).toISOString().slice(11, 16)} UTC
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
