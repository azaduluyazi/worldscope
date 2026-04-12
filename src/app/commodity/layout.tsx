import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commodity Markets — WorldScope",
  description: "Track global commodity prices, oil, gas, metals, and agricultural markets in real-time.",
  keywords: [
    "commodity prices", "gold price", "oil price", "silver price",
    "wheat price", "commodity market tracker", "metals market",
    "agricultural commodities", "commodity futures",
    "emtia fiyatları", "altın fiyatı", "petrol fiyatı", "gümüş fiyatı",
  ],
  alternates: { canonical: "/commodity" },
};

export default function CommodityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
