import type { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { AdSenseUnit, AdConsentBanner } from "@/components/ads";
import { NewsletterPopup } from "@/components/shared/NewsletterPopup";

export const metadata: Metadata = {
  title: "Intelligence Analytics — WorldScope",
  description: "Advanced event analytics, trend monitoring, severity analysis, and export tools for WorldScope global intelligence.",
  openGraph: {
    title: "Intelligence Analytics — WorldScope",
    description: "Advanced event analytics and trend monitoring dashboard.",
    type: "website",
  },
  alternates: {
    canonical: "/analytics",
  },
};

export default function AnalyticsPage() {
  return (
    <>
      <AnalyticsDashboard />
      <AdSenseUnit slot="3344556677" format="horizontal" className="mt-4" />
      <AdConsentBanner />
      <NewsletterPopup />
    </>
  );
}
