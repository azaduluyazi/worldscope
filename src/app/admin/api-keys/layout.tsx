import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Key Management",
  description: "Manage API keys.",
  robots: { index: false, follow: false },
};

export default function ApiKeysLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
