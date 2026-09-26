import { DistributionCharts } from "@/components/metrics/distribution-chart";
import { Heatmap } from "@/components/metrics/heatmap";
import { ParticipationBars } from "@/components/metrics/participation-bars";
import { QuarterTrends } from "@/components/metrics/quarter-trends";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function AnalyticsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        className="mb-0"
        actions={<ExportButton rows={csv.length > 1 ? csv : []} filename={`analytics-${context.organization.slug}-${new Date().toISOString().slice(0, 10)}.csv`} />}
      />
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
        <AnalyticsFilters filters={filters} options={data.options} />
        <SavedViews views={views} query={filtersToQuery(filters)} />
      </div>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t("privacy", { min: MIN_GROUP })}
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("byRound")}</CardTitle>
            <CardDescription>{t("byRoundText")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ParticipationBars bars={data.participation.byRound} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("byTeam")}</CardTitle>
            <CardDescription>{t("byTeamText")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ParticipationBars bars={data.participation.byTeam} />
          </CardContent>
        </Card>
      </div>
      {data.test ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("heatmap")}</CardTitle>
              <CardDescription>{t("heatmapText", { test: data.test.name })}</CardDescription>
            </CardHeader>
            <CardContent>
              <Heatmap groups={data.heatmap} everyoneLabel={everyone} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("distributions")}</CardTitle>
              <CardDescription>{t("distributionsText", { test: data.test.name, count: data.test.people })}</CardDescription>
            </CardHeader>
            <CardContent>
              {data.distributions.length > 0 ? (
                <DistributionCharts scales={data.distributions} />
              ) : (
                <p className="text-sm text-muted-foreground">{t("tooFew", { min: MIN_GROUP })}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("quarters")}</CardTitle>
              <CardDescription>{t("quartersText", { test: data.test.name })}</CardDescription>
            </CardHeader>
            <CardContent>
              {data.quarters.length > 0 ? (
                <QuarterTrends series={data.quarters} />
              ) : (
                <p className="text-sm text-muted-foreground">{t("tooFew", { min: MIN_GROUP })}</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="rounded-xl border bg-card p-6 text-muted-foreground">{t("noResults")}</p>
      )}
    </div>
  );
}
