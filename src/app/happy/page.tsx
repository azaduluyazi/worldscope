import { DashboardSEO } from "@/components/seo/DashboardSEO";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function HappyDashboard() {
  return (
    <>
      <DashboardSEO variant="happy" />
      <DashboardShell variant="happy" />
    </>
  );
}
