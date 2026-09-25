import { PageHeader } from "@/components/page-header";
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
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} className="mb-0" />
      <DashboardStatistics />
      <DashboardRecentSubmissions />
    </div>
  );
}
