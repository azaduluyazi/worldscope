import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "WorldScope — Global Intelligence Dashboard",
  description: "Real-time global events monitoring with interactive maps, live feeds, and AI-powered analysis.",
};

/** FAQPage JSON-LD — only on the homepage to avoid duplication across routes */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is WorldScope?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "WorldScope is a free real-time global intelligence dashboard by TroiaMedia that monitors geopolitical events, conflicts, cyber threats, financial markets, and more across 195 countries using 570+ verified sources.",
      },
    },
    {
      "@type": "Question",
      name: "Is WorldScope free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, WorldScope is completely free. All monitoring modules including ARES (conflicts), ATHENA (cybersecurity), HERMES (finance), and others are available at no cost with no account required.",
      },
    },
    {
      "@type": "Question",
      name: "What data sources does WorldScope use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "WorldScope aggregates data from 570+ verified sources including government agencies, news outlets, OSINT feeds, ADS-B flight data, AIS vessel tracking, weather services, and financial market APIs.",
      },
    },
    {
      "@type": "Question",
      name: "Does WorldScope have an API?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, WorldScope provides a free public API that requires no authentication. You can access real-time intelligence data, event feeds, and country risk assessments programmatically.",
      },
    },
    {
      "@type": "Question",
      name: "What is OSINT and how does WorldScope use it?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OSINT (Open Source Intelligence) is intelligence gathered from publicly available sources. WorldScope uses OSINT methodology to aggregate, analyze, and visualize global events in real-time through interactive maps and AI-powered briefings.",
      },
    },
  ],
};

export default function WorldDashboard() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <DashboardShell variant="world" />
    </>
  );
}
