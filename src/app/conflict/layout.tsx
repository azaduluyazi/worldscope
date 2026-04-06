import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "ConflictScope — Conflict & Security Monitor",
  description: "Active conflicts, military operations, OREF rocket alerts, ACLED/UCDP data, and security incidents worldwide.",
  keywords: [
    "conflict tracker", "war map", "military intelligence", "security events",
    "OREF alerts", "ACLED data", "armed conflict", "protest tracker",
    "drone strikes", "military base map", "live conflict map",
    "real-time war monitoring", "global conflict dashboard",
    "war news", "war news today", "nuclear threat",
    "çatışma haritası", "askeri istihbarat", "savaş takip",
  ],
  alternates: {
    canonical: "/conflict",
  },
};
export default function ConflictLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
