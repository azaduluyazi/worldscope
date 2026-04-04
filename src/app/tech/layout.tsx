import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TechScope — Technology Intelligence Monitor",
  description:
    "Real-time AI, cybersecurity, semiconductors, space, and technology monitoring dashboard.",
  keywords: [
    "technology",
    "AI",
    "cybersecurity",
    "semiconductors",
    "space",
    "tech news",
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
