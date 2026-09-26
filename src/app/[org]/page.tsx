import { PageHeader } from "@/components/page-header";
import { ensureMember } from "@/utils/authentication";
import { getFormatter, getTranslations } from "next-intl/server";
import { DashboardRecentSubmissions } from "./components/dashboard-recent-submissions";
import { DashboardStatistics } from "./components/dashboard-statistics";
import { DashboardWork } from "./components/dashboard-work";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("home") };
}

export default async function DashboardPage() {
  // Before the widgets below, which throw rather than redirect for people without access.
  const { user, organization } = await ensureMember("viewDashboard");
  const t = await getTranslations("dashboard.home");
  const nav = await getTranslations("dashboard.nav");
  const format = await getFormatter();

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow={format.dateTime(new Date(), { weekday: "long", day: "numeric", month: "long" })}
        title={user.name ? t("greeting", { name: user.name }) : nav("home")}
        description={t("description", { organization: organization.name })}
        crumb={nav("home")}
        className="mb-0"
      />
      <DashboardStatistics />
      <DashboardWork />
      <DashboardRecentSubmissions />
    </div>
  );
}
