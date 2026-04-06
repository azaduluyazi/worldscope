import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "SportsScope — Global Sports Intelligence",
  description: "Live sports scores, transfers, match results, and global sports news monitoring.",
  keywords: [
    "sports intelligence", "live football scores", "basketball tracker",
    "tennis live", "Olympics news", "FIFA rankings",
    "transfer news", "sports analytics", "match results live",
    "Premier League", "Champions League", "NBA scores",
    "spor haberleri", "canlı skor", "futbol takip",
  ],
  alternates: { canonical: "/sports" },
};
export default function SportsLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
