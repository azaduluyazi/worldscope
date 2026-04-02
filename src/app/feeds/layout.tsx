import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed Sources — WorldScope",
  description: "Browse and discover all intelligence feed sources powering WorldScope real-time data.",
};

export default function FeedsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
