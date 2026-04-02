import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Layouts",
  description: "Create and manage custom dashboard layouts for personalized intelligence monitoring.",
};

export default function LayoutsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
