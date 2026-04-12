import { DashboardSEO } from "@/components/seo/DashboardSEO";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function SportsDashboard() {
  return (
    <>
      <DashboardSEO variant="sports" />
      <DashboardShell variant="sports" />
    </>
  );
}
