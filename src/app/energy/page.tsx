import { DashboardSEO } from "@/components/seo/DashboardSEO";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function EnergyDashboard() {
  return (
    <>
      <DashboardSEO variant="energy" />
      <DashboardShell variant="energy" />
    </>
  );
}
