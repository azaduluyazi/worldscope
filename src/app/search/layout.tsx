import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search — WorldScope",
  description: "Search across global events, intelligence reports, and news from 100+ sources.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
