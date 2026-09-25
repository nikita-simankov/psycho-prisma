import { Separator } from "@/components/ui/separator";
import { getTranslations } from "next-intl/server";
import { DashboardRecentSubmissions } from "./components/dashboard-recent-submissions";
import { DashboardStatistics } from "./components/dashboard-statistics";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("home") };
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard.home");

  return (
    <div className="p-12 flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-wide">{t("title")}</h1>
      <Separator />
      <DashboardStatistics />
      <DashboardRecentSubmissions />
    </div>
  );
}
