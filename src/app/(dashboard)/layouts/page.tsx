"use client";

import { useRouter } from "next/navigation";

const layoutDefs = [
  { id: "alpha", name: "Alpha", desc: "Wide globe + triple column", icon: "🅰️", full: true },
  { id: "bravo", name: "Bravo", desc: "Centered globe + surrounding panels", icon: "🅱️", full: true },
  { id: "charlie", name: "Charlie", desc: "Full-width stacked sections", icon: "©️", full: true },
  { id: "delta", name: "Delta", desc: "Dashboard grid — analytics", icon: "🔷", full: true },
  { id: "echo", name: "Echo", desc: "Immersive globe + floating panels", icon: "📡", full: true },
  { id: "foxtrot", name: "Foxtrot", desc: "Tabbed full-screen panels", icon: "📑", full: true },
  { id: "golf", name: "Golf", desc: "Two-row cinema layout", icon: "🎬", full: true },
  { id: "hotel", name: "Hotel", desc: "Left sidebar + main content", icon: "📋", full: true },
  { id: "india", name: "India", desc: "Picture-in-Picture windows", icon: "🖼️", full: true },
  { id: "juliet", name: "Juliet", desc: "Horizontal mission control", icon: "🚀", full: true },
  { id: "command-center", name: "Command Center", desc: "Military ops globe + panels", icon: "🎖️", full: false },
  { id: "war-room", name: "War Room", desc: "4-corner panels", icon: "🎯", full: false },
  { id: "satellite", name: "Satellite", desc: "Telemetry panels", icon: "🛰️", full: false },
  { id: "recon", name: "Recon", desc: "Bottom data matrix", icon: "👁️", full: false },
  { id: "pentagon", name: "Pentagon", desc: "Single tabbed panel", icon: "🏛️", full: false },
  { id: "grid-ops", name: "Grid Ops", desc: "6-panel floating grid", icon: "🔲", full: false },
  { id: "cic", name: "CIC", desc: "Naval situation display", icon: "⚓", full: false },
  { id: "horizon", name: "Horizon", desc: "Horizontal scroll feed", icon: "🌅", full: false },
  { id: "tri-panel", name: "Tri-Panel", desc: "Three columns", icon: "📐", full: false },
  { id: "orbital", name: "Orbital", desc: "Circular arrangement", icon: "🪐", full: false },
];

export default function LayoutPreviewPage() {
  const router = useRouter();
  const fullLayouts = layoutDefs.filter(l => l.full);
  const globeLayouts = layoutDefs.filter(l => !l.full);

  return (
    <div className="min-h-screen bg-[#050a12] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard Layouts</h1>
        <p className="text-[#5a7a9a] text-sm mb-8">{layoutDefs.length} unique layouts</p>

        <h2 className="text-sm font-mono text-[#00e5ff] tracking-wider mb-3">
          FULL DASHBOARD ({fullLayouts.length}) — TV + Webcams + Feed + Alerts + Globe
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {fullLayouts.map(l => (
            <button key={l.id} onClick={() => router.push(`/layouts/${l.id}`)}
              className="group text-left bg-[#0a1222] border border-[#0d2137] rounded-lg p-5 hover:border-[#00e5ff]/50 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{l.icon}</span>
                <div>
                  <h3 className="text-white font-semibold text-sm group-hover:text-[#00e5ff]">{l.name}</h3>
                  <p className="text-[#5a7a9a] text-xs">{l.desc}</p>
                </div>
              </div>
              <span className="text-[8px] font-mono text-[#00ff88] bg-[#00ff88]/10 px-1.5 py-0.5 rounded">FULL</span>
            </button>
          ))}
        </div>

        <h2 className="text-sm font-mono text-[#ffd000] tracking-wider mb-3">
          GLOBE + INTEL ({globeLayouts.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {globeLayouts.map(l => (
            <button key={l.id} onClick={() => router.push(`/layouts/${l.id}`)}
              className="group text-left bg-[#0a1222] border border-[#0d2137] rounded-lg p-5 hover:border-[#ffd000]/50 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{l.icon}</span>
                <div>
                  <h3 className="text-white font-semibold text-sm group-hover:text-[#ffd000]">{l.name}</h3>
                  <p className="text-[#5a7a9a] text-xs">{l.desc}</p>
                </div>
              </div>
              <span className="text-[8px] font-mono text-[#ffd000] bg-[#ffd000]/10 px-1.5 py-0.5 rounded">GLOBE</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
