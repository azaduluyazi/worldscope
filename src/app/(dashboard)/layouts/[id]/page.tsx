"use client";

import { useParams } from "next/navigation";
import dynamic, { type Loader as DynLoader } from "next/dynamic";
import Link from "next/link";
import type { ComponentType } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dyn = (loader: () => Promise<{ default: ComponentType<any> }>) =>
  dynamic(loader as DynLoader, { ssr: false, loading: () => <Loader /> });

// Each layout loaded individually — only the clicked one gets compiled
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const layouts: Record<string, { component: ComponentType<any>; name: string }> = {
  "alpha": { component: dyn(() => import("@/components/dashboard/layouts/AlphaLayout").then(m => ({ default: m.AlphaLayout }))), name: "Alpha" },
  "bravo": { component: dyn(() => import("@/components/dashboard/layouts/BravoLayout").then(m => ({ default: m.BravoLayout }))), name: "Bravo" },
  "charlie": { component: dyn(() => import("@/components/dashboard/layouts/CharlieLayout").then(m => ({ default: m.CharlieLayout }))), name: "Charlie" },
  "delta": { component: dyn(() => import("@/components/dashboard/layouts/DeltaLayout").then(m => ({ default: m.DeltaLayout }))), name: "Delta" },
  "echo": { component: dyn(() => import("@/components/dashboard/layouts/EchoLayout").then(m => ({ default: m.EchoLayout }))), name: "Echo" },
  "foxtrot": { component: dyn(() => import("@/components/dashboard/layouts/FoxtrotLayout").then(m => ({ default: m.FoxtrotLayout }))), name: "Foxtrot" },
  "golf": { component: dyn(() => import("@/components/dashboard/layouts/GolfLayout").then(m => ({ default: m.GolfLayout }))), name: "Golf" },
  "hotel": { component: dyn(() => import("@/components/dashboard/layouts/HotelLayout").then(m => ({ default: m.HotelLayout }))), name: "Hotel" },
  "india": { component: dyn(() => import("@/components/dashboard/layouts/IndiaLayout").then(m => ({ default: m.IndiaLayout }))), name: "India" },
  "juliet": { component: dyn(() => import("@/components/dashboard/layouts/JulietLayout").then(m => ({ default: m.JulietLayout }))), name: "Juliet" },
  "command-center": { component: dyn(() => import("@/components/dashboard/layouts/CommandCenterLayout").then(m => ({ default: m.CommandCenterLayout }))), name: "Command Center" },
  "war-room": { component: dyn(() => import("@/components/dashboard/layouts/WarRoomLayout").then(m => ({ default: m.WarRoomLayout }))), name: "War Room" },
  "satellite": { component: dyn(() => import("@/components/dashboard/layouts/SatelliteLayout").then(m => ({ default: m.SatelliteLayout }))), name: "Satellite" },
  "recon": { component: dyn(() => import("@/components/dashboard/layouts/ReconLayout").then(m => ({ default: m.ReconLayout }))), name: "Recon" },
  "pentagon": { component: dyn(() => import("@/components/dashboard/layouts/PentagonLayout").then(m => ({ default: m.PentagonLayout }))), name: "Pentagon" },
  "grid-ops": { component: dyn(() => import("@/components/dashboard/layouts/GridOpsLayout").then(m => ({ default: m.GridOpsLayout }))), name: "Grid Ops" },
  "cic": { component: dyn(() => import("@/components/dashboard/layouts/CICLayout").then(m => ({ default: m.CICLayout }))), name: "CIC" },
  "horizon": { component: dyn(() => import("@/components/dashboard/layouts/HorizonLayout").then(m => ({ default: m.HorizonLayout }))), name: "Horizon" },
  "tri-panel": { component: dyn(() => import("@/components/dashboard/layouts/TriPanelLayout").then(m => ({ default: m.TriPanelLayout }))), name: "Tri-Panel" },
  "orbital": { component: dyn(() => import("@/components/dashboard/layouts/OrbitalLayout").then(m => ({ default: m.OrbitalLayout }))), name: "Orbital" },
};

function Loader() {
  return (
    <div className="w-full h-screen bg-[#050a12] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-mono text-[#00e5ff] text-sm tracking-wider">LOADING LAYOUT...</p>
      </div>
    </div>
  );
}

export default function LayoutViewPage() {
  const params = useParams();
  const id = params.id as string;
  const entry = layouts[id];

  if (!entry) {
    return (
      <div className="w-full h-screen bg-[#050a12] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Layout not found: {id}</p>
          <Link href="/layouts" className="text-[#00e5ff] font-mono text-sm hover:underline">← Back to Gallery</Link>
        </div>
      </div>
    );
  }

  const LayoutComponent = entry.component;

  return (
    <div className="relative w-full h-screen">
      <Link
        href="/layouts"
        className="fixed top-3 left-3 z-[9999] bg-black/80 text-white px-3 py-1.5 rounded-lg font-mono text-[11px] backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors"
      >
        ← Back
      </Link>
      <LayoutComponent variant="world" />
    </div>
  );
}
