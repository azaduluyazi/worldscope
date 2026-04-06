import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "EnergyScope — Energy & Infrastructure Monitor",
  description: "Oil, gas, nuclear, renewable energy, power grids, and critical infrastructure monitoring.",
  keywords: [
    "energy intelligence", "oil price tracker", "natural gas monitor",
    "nuclear power plants map", "renewable energy", "infrastructure map",
    "pipeline map", "power outage tracker", "energy geopolitics",
    "OPEC monitor", "LNG tracker", "electricity grid",
    "enerji istihbaratı", "petrol fiyatları", "nükleer santral haritası",
  ],
  alternates: { canonical: "/energy" },
};
export default function EnergyLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
