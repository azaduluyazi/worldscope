import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commodity Markets — WorldScope",
  description: "Track global commodity prices, oil, gas, metals, and agricultural markets in real-time.",
};

export default function CommodityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
