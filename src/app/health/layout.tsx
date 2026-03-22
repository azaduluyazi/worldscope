import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "HealthScope — Global Health Intelligence",
  description: "Disease outbreaks, WHO alerts, radiation monitoring, pandemic tracking, and health emergencies.",
  keywords: ["health", "pandemic", "outbreak", "WHO", "disease", "radiation"],
};
export default function HealthLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
