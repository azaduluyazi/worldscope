import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed Health Monitor | WorldScope",
  description:
    "Real-time monitoring of 500+ intelligence data feeds across 10 categories",
};

export default function FeedsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
