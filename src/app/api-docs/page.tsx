import type { Metadata } from "next";
import { ApiDocsPage } from "@/components/api-docs/ApiDocsPage";

export const metadata: Metadata = {
  title: "API Documentation — WorldScope",
  description: "Public API documentation for WorldScope global intelligence platform. Access real-time intelligence, threat scores, and market data.",
  openGraph: {
    title: "API Documentation — WorldScope",
    description: "Public API for global intelligence data access.",
    type: "website",
  },
};

export default function ApiDocs() {
  return <ApiDocsPage />;
}
