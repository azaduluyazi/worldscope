import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "EnergyScope — Energy & Infrastructure Monitor",
  description: "Oil, gas, nuclear, renewable energy, power grids, and critical infrastructure monitoring.",
  keywords: ["energy", "oil", "gas", "nuclear", "renewable", "infrastructure"],
};
export default function EnergyLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
