import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FinScope — Financial Intelligence Dashboard",
  description:
    "Real-time markets, crypto, commodities, central banks, and economic monitoring dashboard.",
  keywords: [
    "financial markets dashboard", "crypto tracker", "commodity prices",
    "forex monitor", "central bank rates", "stock market live",
    "bitcoin price", "fear and greed index", "prediction markets",
    "Polymarket", "geopolitical market impact", "economic indicators",
    "real-time market data", "global finance monitor",
    "finans panosu", "kripto takip", "piyasa izleme", "borsa verileri",
  ],
  openGraph: {
    title: "FinScope — Financial Intelligence Dashboard",
    description:
      "Real-time markets, crypto, commodities, central banks, and economic monitoring dashboard.",
  },
  alternates: {
    canonical: "/finance",
  },
};

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
