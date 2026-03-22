import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "ConflictScope — Conflict & Security Monitor",
  description: "Active conflicts, military operations, OREF rocket alerts, ACLED/UCDP data, and security incidents worldwide.",
  keywords: ["conflict", "war", "military", "security", "OREF", "ACLED"],
};
export default function ConflictLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
