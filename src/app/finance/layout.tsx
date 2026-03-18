import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FinScope — Financial Intelligence Dashboard",
  description:
    "Real-time markets, crypto, commodities, central banks, and economic monitoring dashboard.",
  keywords: [
    "markets",
    "finance",
    "crypto",
    "commodities",
    "forex",
    "central banks",
  ],
  openGraph: {
    title: "FinScope — Financial Intelligence Dashboard",
    description:
      "Real-time markets, crypto, commodities, central banks, and economic monitoring dashboard.",
  },
};

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
