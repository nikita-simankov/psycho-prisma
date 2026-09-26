import { DistributionCharts } from "@/components/metrics/distribution-chart";
import { Heatmap } from "@/components/metrics/heatmap";
import { ParticipationBars } from "@/components/metrics/participation-bars";
import { QuarterTrends } from "@/components/metrics/quarter-trends";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/page-templates";
import { filtersToQuery, parseFilters } from "@/utils/analytics-filters";
import { ensureMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { MIN_GROUP } from "@/utils/results";
import { Users } from "lucide-react";
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
        actions={<ExportButton rows={csv.length > 1 ? csv : []} filename={`analytics-${context.organization.slug}-${new Date().toISOString().slice(0, 10)}.csv`} />}
      />
      <div className="-mt-4 flex flex-col gap-4 border-y py-4 print:hidden">
        <SavedViews views={views} query={filtersToQuery(filters)} />
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
          <Section title={t("heatmap")} description={t("heatmapText", { test: data.test.name })}>
              <Heatmap groups={data.heatmap} everyoneLabel={everyone} />
          </Section>
          <Section title={t("distributions")} description={t("distributionsText", { test: data.test.name, count: data.test.people })}>
              {data.distributions.length > 0 ? (
                <DistributionCharts scales={data.distributions} />
              ) : (
                <p className="text-sm text-muted-foreground">{t("tooFew", { min: MIN_GROUP })}</p>
              )}
          </Section>
          <Section title={t("quarters")} description={t("quartersText", { test: data.test.name })}>
              {data.quarters.length > 0 ? (
                <QuarterTrends series={data.quarters} />
              ) : (
                <p className="text-sm text-muted-foreground">{t("tooFew", { min: MIN_GROUP })}</p>
              )}
          </Section>
        </>
      ) : (
        <p className="border-t border-foreground/80 pt-4 text-muted-foreground">{t("noResults")}</p>
      )}
    </div>
  );
}
