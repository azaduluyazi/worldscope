import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "HealthScope — Global Health Intelligence",
  description: "Disease outbreaks, WHO alerts, radiation monitoring, pandemic tracking, and health emergencies.",
  keywords: [
    "health intelligence", "pandemic tracker", "disease outbreak map",
    "WHO alerts", "radiation monitoring", "epidemiology dashboard",
    "global health monitor", "bird flu tracker", "mpox tracking",
    "real-time health alerts", "nuclear radiation map",
    "pandemic news", "pandemic tracker live", "disease outbreak today",
    "salgın takip", "sağlık istihbaratı", "radyasyon izleme",
  ],
  alternates: { canonical: "/health" },
};
export default function HealthLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
