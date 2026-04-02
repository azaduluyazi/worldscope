import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Hub — WorldScope",
  description: "API documentation, SDKs, and developer resources for integrating WorldScope intelligence data.",
};

export default function DevelopersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
