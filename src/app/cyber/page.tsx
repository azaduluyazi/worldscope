import { DashboardSEO } from "@/components/seo/DashboardSEO";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function CyberDashboard() {
  return (
    <>
      <DashboardSEO variant="cyber" />
      <DashboardShell variant="cyber" />
    </>
  );
}
