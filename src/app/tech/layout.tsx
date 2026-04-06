import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TechScope — Technology Intelligence Monitor",
  description:
    "Real-time AI, cybersecurity, semiconductors, space, and technology monitoring dashboard.",
  keywords: [
    "technology intelligence", "AI news", "semiconductor tracker",
    "space launches", "tech monitor", "SpaceX Starlink",
    "cloud infrastructure", "AI labs", "startup funding",
    "real-time tech news", "satellite launches live",
    "quantum computing", "chip shortage tracker",
    "teknoloji haberleri", "yapay zeka", "uzay fırlatmaları",
  ],
  openGraph: {
    title: "TechScope — Technology Intelligence Monitor",
    description:
      "Real-time AI, cybersecurity, semiconductors, space, and technology monitoring dashboard.",
  },
  alternates: {
    canonical: "/tech",
  },
};

export default function TechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
