import { Separator } from "@/components/ui/separator";
import { DashboardRecentSubmissions } from "./components/dashboard-recent-submissions";
import { DashboardStatistics } from "./components/dashboard-statistics";

export default async function DashboardPage() {
  return (
    <div className="p-12 flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-wide">Панель управления</h1>
      <Separator />
      <DashboardStatistics />
      <DashboardRecentSubmissions />
    </div>
  );
}
