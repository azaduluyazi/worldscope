import type { ComponentType } from "react";
import type { VariantId } from "@/config/variants";

// Full layouts (include ALL components: TV, webcams, feed, alerts, globe, ticker)
import { AlphaLayout } from "./AlphaLayout";
import { BravoLayout } from "./BravoLayout";
import { CharlieLayout } from "./CharlieLayout";
import { DeltaLayout } from "./DeltaLayout";
import { EchoLayout } from "./EchoLayout";
import { FoxtrotLayout } from "./FoxtrotLayout";
import { GolfLayout } from "./GolfLayout";
import { HotelLayout } from "./HotelLayout";
import { IndiaLayout } from "./IndiaLayout";
import { JulietLayout } from "./JulietLayout";

// Globe-only layouts (lighter, globe + intel only)
import { CommandCenterLayout } from "./CommandCenterLayout";
import { WarRoomLayout } from "./WarRoomLayout";
import { SatelliteLayout } from "./SatelliteLayout";
import { ReconLayout } from "./ReconLayout";
import { PentagonLayout } from "./PentagonLayout";
import { GridOpsLayout } from "./GridOpsLayout";
import { CICLayout } from "./CICLayout";
import { HorizonLayout } from "./HorizonLayout";
import { TriPanelLayout } from "./TriPanelLayout";
import { OrbitalLayout } from "./OrbitalLayout";

export interface FullLayoutProps {
  variant: VariantId;
}

export interface LayoutEntry {
  id: string;
  name: string;
  description: string;
  icon: string;
  full: boolean; // true = includes ALL components (TV, webcams, etc.)
  component: ComponentType<FullLayoutProps> | ComponentType<{ items: unknown[]; variant: string }>;
}

export const LAYOUTS: LayoutEntry[] = [
  // ── Full Layouts (include TV, webcams, everything) ──
  { id: "alpha", name: "Alpha", description: "Wide globe + triple column — TV, webcams, feed, alerts", icon: "🅰️", full: true, component: AlphaLayout },
  { id: "bravo", name: "Bravo", description: "Centered globe + surrounding panels", icon: "🅱️", full: true, component: BravoLayout },
  { id: "charlie", name: "Charlie", description: "Full-width stacked sections", icon: "©️", full: true, component: CharlieLayout },
  { id: "delta", name: "Delta", description: "Dashboard grid — analytics inspired", icon: "🔷", full: true, component: DeltaLayout },
  { id: "echo", name: "Echo", description: "Immersive globe + floating panels", icon: "📡", full: true, component: EchoLayout },
  { id: "foxtrot", name: "Foxtrot", description: "Tabbed full-screen panels", icon: "📑", full: true, component: FoxtrotLayout },
  { id: "golf", name: "Golf", description: "Two-row cinema layout", icon: "🎬", full: true, component: GolfLayout },
  { id: "hotel", name: "Hotel", description: "Left sidebar + main content", icon: "📋", full: true, component: HotelLayout },
  { id: "india", name: "India", description: "Picture-in-Picture floating windows", icon: "🖼️", full: true, component: IndiaLayout },
  { id: "juliet", name: "Juliet", description: "Mission control horizontal scroll", icon: "🚀", full: true, component: JulietLayout },

  // ── Globe-only Layouts (intel + globe, no TV/webcams) ──
  { id: "command-center", name: "Command Center", description: "Military ops — globe + floating intel panels", icon: "🎖️", full: false, component: CommandCenterLayout as ComponentType<FullLayoutProps> },
  { id: "war-room", name: "War Room", description: "Pentagon — 4-corner panels", icon: "🎯", full: false, component: WarRoomLayout as ComponentType<FullLayoutProps> },
  { id: "satellite", name: "Satellite", description: "Satellite ops — telemetry panels", icon: "🛰️", full: false, component: SatelliteLayout as ComponentType<FullLayoutProps> },
  { id: "recon", name: "Recon", description: "Reconnaissance — bottom data matrix", icon: "👁️", full: false, component: ReconLayout as ComponentType<FullLayoutProps> },
  { id: "pentagon", name: "Pentagon", description: "Briefing — single tabbed panel", icon: "🏛️", full: false, component: PentagonLayout as ComponentType<FullLayoutProps> },
  { id: "grid-ops", name: "Grid Ops", description: "6-panel floating grid", icon: "🔲", full: false, component: GridOpsLayout as ComponentType<FullLayoutProps> },
  { id: "cic", name: "CIC", description: "Naval CIC — bottom situation display", icon: "⚓", full: false, component: CICLayout as ComponentType<FullLayoutProps> },
  { id: "horizon", name: "Horizon", description: "Horizontal scroll card feed", icon: "🌅", full: false, component: HorizonLayout as ComponentType<FullLayoutProps> },
  { id: "tri-panel", name: "Tri-Panel", description: "Three column panels", icon: "📐", full: false, component: TriPanelLayout as ComponentType<FullLayoutProps> },
  { id: "orbital", name: "Orbital", description: "Circular panel arrangement", icon: "🪐", full: false, component: OrbitalLayout as ComponentType<FullLayoutProps> },
];

export const LAYOUT_MAP = Object.fromEntries(
  LAYOUTS.map((l) => [l.id, l])
) as Record<string, LayoutEntry>;

export const LAYOUT_IDS = LAYOUTS.map((l) => l.id);
export const FULL_LAYOUT_IDS = LAYOUTS.filter((l) => l.full).map((l) => l.id);
