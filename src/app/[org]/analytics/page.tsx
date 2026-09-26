import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { BalanceMap } from "@/components/metrics/balance-map";
import { DistributionCharts } from "@/components/metrics/distribution-chart";
import { Heatmap } from "@/components/metrics/heatmap";
import { ParticipationBars } from "@/components/metrics/participation-bars";
import { PrivacyMask } from "@/components/metrics/privacy-mask";
import { NormsToggle } from "@/components/results/norms-toggle";
import { QuarterTrends } from "@/components/metrics/quarter-trends";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/page-templates";
import { filtersToQuery, parseFilters } from "@/utils/analytics-filters";
import { ensureMember } from "@/utils/authentication";
import { getPlan } from "@/utils/billing";
import { featureLevel, hasFeature } from "@/utils/billing-rules";
import { UpgradeNotice } from "@/components/billing/upgrade-notice";
import { prisma } from "@/utils/database";
import { MIN_GROUP } from "@/utils/results";
import { BarChart3, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AnalyticsFilters } from "./analytics-filters";
import { ExportButton } from "./export-button";
import { loadAnalytics } from "./load-analytics";
import { SavedViews } from "./saved-views";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("analytics") };
}

export default async function AnalyticsPage(
  props: { searchParams: Promise<Record<string, string | string[] | undefined>> }
) {
  const searchParams = await props.searchParams;
  const context = await ensureMember("viewDashboard");
  const t = await getTranslations("analytics");
  const { plan } = await getPlan(context.organization.id);
  if (!hasFeature(plan, "analytics")) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title={t("title")} description={t("description")} className="mb-0" />
        <UpgradeNotice feature="analytics" />
      </div>
    );
  }
  const chart = await getTranslations("profileChart");
  const filters = parseFilters(searchParams);
  const [data, views] = await Promise.all([
    loadAnalytics(context, filters),
    prisma.analyticsView.findMany({
      where: { organizationId: context.organization.id, userId: context.user.id },
      select: { id: true, name: true, query: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const everyone = filters.team || filters.position ? t("everyoneInView") : t("everyone");
  const withNorms = (norms: "published" | "org") => {
    const query = filtersToQuery({ ...filters, norms: norms === "org" ? "org" : undefined });
    return `/${context.organization.slug}/analytics${query ? `?${query}` : ""}`;
  };

  // The figures shown on the page, one table after another.
  const csv: (string | number | null)[][] = [
    [t("csv.section"), t("csv.group"), t("csv.measure"), t("csv.value"), t("csv.people")],
    ...data.participation.byRound.flatMap((bar) => (bar.value ? [[t("byRound"), bar.name, t("csv.completed"), bar.value.percent, bar.value.total]] : [])),
    ...data.participation.byTeam.flatMap((bar) => (bar.value ? [[t("byTeam"), bar.name, t("csv.completed"), bar.value.percent, bar.value.total]] : [])),
    ...data.distributions.flatMap((scale) =>
      scale.bins.map((bin) => [t("distributions"), scale.scaleName, `${chart(`kind.${scale.kind}`)} ${bin.label}`, bin.count, scale.people])
    ),
    ...data.heatmap.flatMap((group) =>
      group.scales.filter((scale) => scale.kind !== "raw").map((scale) => [t("heatmap"), group.teamName ?? everyone, scale.scaleName, scale.average, group.people])
    ),
    ...data.balance.flatMap((group) =>
      group.scales.flatMap((scale) =>
        (["low", "average", "high"] as const).map((band) => [t("balance.title"), group.teamName ?? everyone, `${scale.scaleName}: ${chart(`band.${band}`)}`, scale[band], scale.total])
      )
    ),
    ...data.quarters.flatMap((scale) =>
      scale.points.map((point) => [t("quarters"), t("quarter", { quarter: point.quarter, year: point.year }), scale.scaleName, point.average, point.people])
    ),
  ];

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title={t("title")}
        description={t("description")}
        className="mb-0"
        actions={
          hasFeature(plan, "export") && (
            <ExportButton rows={csv.length > 1 ? csv : []} filename={`analytics-${context.organization.slug}-${new Date().toISOString().slice(0, 10)}.csv`} />
          )
        }
      />
      <div className="-mt-4 flex flex-col gap-4 border-y py-4 print:hidden">
        {featureLevel(plan, "analytics") === true && <SavedViews views={views} query={filtersToQuery(filters)} />}
        <AnalyticsFilters filters={filters} options={data.options} />
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Users className="size-3.5 shrink-0" aria-hidden />
          {t("privacy", { min: MIN_GROUP })}
        </p>
      </div>
      <div className="grid gap-10 lg:grid-cols-2">
        <Section title={t("byRound")} description={t("byRoundText")}>
            <ParticipationBars bars={data.participation.byRound} />
          </Section>
        <Section title={t("byTeam")} description={t("byTeamText")}>
            <ParticipationBars bars={data.participation.byTeam} />
          </Section>
      </div>
      {data.test ? (
        <>
          <NormsToggle current={data.norms.source} norms={data.norms.org} hrefs={{ published: withNorms("published"), org: withNorms("org") }} className="-mt-4" />
          <Section title={t("heatmap")} description={t("heatmapText", { test: data.test.name })}>
              <Heatmap groups={data.heatmap} hidden={data.hidden} everyoneLabel={everyone} />
          </Section>
          <Section title={t("balance.title")} description={t("balance.text", { test: data.test.name })}>
              <BalanceMap groups={data.balance} everyoneLabel={everyone} />
          </Section>
          <Section title={t("distributions")} description={t("distributionsText", { test: data.test.name, count: data.test.people })}>
              {data.distributions.length > 0 ? (
                <DistributionCharts scales={data.distributions} />
              ) : (
                <PrivacyMask />
              )}
          </Section>
          <Section title={t("quarters")} description={t("quartersText", { test: data.test.name })}>
              {data.quarters.length > 0 ? (
                <QuarterTrends series={data.quarters} />
              ) : (
                <PrivacyMask />
              )}
          </Section>
        </>
      ) : (
        <EmptyState
          icon={BarChart3}
          title={t("noResults")}
          description={t("noResultsText")}
          className="border-t border-foreground/80"
          action={
            <Button asChild variant="outline">
              <Link href={`/${context.organization.slug}/rounds/new`}>{t("startRound")}</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
