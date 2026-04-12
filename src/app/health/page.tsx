import { DashboardSEO } from "@/components/seo/DashboardSEO";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function HealthDashboard() {
  return (
    <>
      <DashboardSEO variant="health" />
      <DashboardShell variant="health" />
    </>
  );
}
