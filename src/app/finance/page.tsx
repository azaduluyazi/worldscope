import { DashboardSEO } from "@/components/seo/DashboardSEO";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function FinanceDashboard() {
  return (
    <>
      <DashboardSEO variant="finance" />
      <DashboardShell variant="finance" />
    </>
  );
}
