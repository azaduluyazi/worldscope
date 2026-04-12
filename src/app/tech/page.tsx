import { DashboardSEO } from "@/components/seo/DashboardSEO";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function TechDashboard() {
  return (
    <>
      <DashboardSEO variant="tech" />
      <DashboardShell variant="tech" />
    </>
  );
}
