import { DashboardSEO } from "@/components/seo/DashboardSEO";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function ConflictDashboard() {
  return (
    <>
      <DashboardSEO variant="conflict" />
      <DashboardShell variant="conflict" />
    </>
  );
}
