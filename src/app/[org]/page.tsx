import { PageHeader } from "@/components/page-header";
import { SetupChecklist } from "@/components/onboarding/setup-checklist";
import { WelcomeCard } from "@/components/onboarding/welcome-card";
import { ensureMember } from "@/utils/authentication";
import { can } from "@/utils/roles";
import { getFormatter, getTranslations } from "next-intl/server";
import { DashboardRecentSubmissions } from "./components/dashboard-recent-submissions";
import { DashboardStatistics } from "./components/dashboard-statistics";
import { DashboardWork } from "./components/dashboard-work";
import { Section } from "@/components/page-templates";
import { CareSummary } from "@/components/wellbeing/care-flags";
import { WellbeingAlerts } from "@/components/wellbeing/wellbeing-alerts";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("home") };
}

export default async function DashboardPage() {
  // Before the widgets below, which throw rather than redirect for people without access.
  const context = await ensureMember("viewDashboard");
  const { user, organization, membership } = context;
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
      {can(membership.role, "manageSettings") && <SetupChecklist organization={organization} user={user} />}
      <WelcomeCard membershipId={membership.id} role={membership.role} organization={organization.name} />
      <CareSummary context={context} />
      <TodayAlerts context={context} />
      <DashboardStatistics />
      <DashboardWork />
      <DashboardRecentSubmissions />
    </div>
  );
}

// Open early warnings, with their next steps; nothing at all when there are none.
async function TodayAlerts({ context }: { context: Awaited<ReturnType<typeof ensureMember>> }) {
  const alerts = await WellbeingAlerts({ context, quiet: true });
  if (!alerts) return null;
  const t = await getTranslations("wellbeing.alerts");
  return (
    <Section title={t("title")} description={t("text")}>
      {alerts}
    </Section>
  );
}
