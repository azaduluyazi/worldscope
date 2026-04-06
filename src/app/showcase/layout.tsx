import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Showcase — WorldScope",
  description: "Featured dashboards, visualizations, and use cases for WorldScope intelligence platform.",
  alternates: { canonical: "/showcase" },
};

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
