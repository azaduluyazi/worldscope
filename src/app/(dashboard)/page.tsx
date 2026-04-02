import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "WorldScope — Global Intelligence Dashboard",
  description: "Real-time global events monitoring with interactive maps, live feeds, and AI-powered analysis.",
};

export default function WorldDashboard() {
  return <DashboardShell variant="world" />;
}
