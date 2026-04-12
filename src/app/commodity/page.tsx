import { DashboardSEO } from "@/components/seo/DashboardSEO";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function CommodityDashboard() {
  return (
    <>
      <DashboardSEO variant="commodity" />
      <DashboardShell variant="commodity" />
    </>
  );
}
