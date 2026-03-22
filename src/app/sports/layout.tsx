import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "SportsScope — Global Sports Intelligence",
  description: "Live sports scores, transfers, match results, and global sports news monitoring.",
  keywords: ["sports", "football", "basketball", "tennis", "olympics", "FIFA", "transfers"],
};
export default function SportsLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
