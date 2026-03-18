import type { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Intelligence Analytics — WorldScope",
  description: "Advanced event analytics, trend monitoring, severity analysis, and export tools for WorldScope global intelligence.",
  openGraph: {
    title: "Intelligence Analytics — WorldScope",
    description: "Advanced event analytics and trend monitoring dashboard.",
    type: "website",
  },
};

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
