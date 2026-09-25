import { PageHeader } from "@/components/page-header";
import { ensureMember } from "@/utils/authentication";
import { getTranslations } from "next-intl/server";
import { DashboardRecentSubmissions } from "./components/dashboard-recent-submissions";
import { DashboardStatistics } from "./components/dashboard-statistics";
import { DashboardWork } from "./components/dashboard-work";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("home") };
}

export default async function DashboardPage() {
  // Before the widgets below, which throw rather than redirect for people without access.
  await ensureMember("viewDashboard");
  const t = await getTranslations("dashboard.home");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} className="mb-0" />
      <DashboardStatistics />
      <DashboardWork />
      <DashboardRecentSubmissions />
    </div>
  );
}
