import { DashboardSEO } from "@/components/seo/DashboardSEO";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function WeatherDashboard() {
  return (
    <>
      <DashboardSEO variant="weather" />
      <DashboardShell variant="weather" />
    </>
  );
}
