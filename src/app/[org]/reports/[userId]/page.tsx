import { PageHeader } from "@/components/page-header";
import { PrintExpander } from "@/components/results/print-expander";
import { TestResultSection } from "@/components/results/test-result-section";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/ui/user-avatar";
import { organizationBase } from "@/utils/organization-path";
import { can } from "@/utils/roles";
import { formatFullName, formatWorkInfo } from "@/utils/user";
import { History } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import PrintButton from "../../components/print-button";
import { loadReport } from "./load-report";
import { auditAs } from "@/utils/audit";
import { ReportEditor, SaveVersionButton } from "./report-editor";
import { ReportOutline } from "./report-outline";

type PathParams = { params: Promise<{ userId: string }> };

export default async function ReportPage(props: PathParams) {
  const params = await props.params;
  const base = await organizationBase();
  const t = await getTranslations("report");
  const reports = await getTranslations("reports");
  const format = await getFormatter();
  const { context, user, results, rounds, draft, versions } = await loadReport(params.userId);

  if (!user) {
    notFound();
  }

  await auditAs(context, "viewReport", { subjectId: user.id });

  const write = can(context.membership.role, "writeConclusions");
  const latest = versions[0];
  const newestResult = results.at(-1)?.createdAt;
  // Changed when the text or the results moved on after the last saved version.
  const changed =
    latest && ((draft && draft.updatedAt > latest.createdAt) || (newestResult && newestResult > latest.createdAt));
  const date = (value: Date) => format.dateTime(value, { dateStyle: "medium" });
  const background = draft?.additionalNotes ?? "";
  const conclusion = draft?.verdict ?? "";

  const sections = (
    <>
      {results.length === 0 && <p className="rounded-xl border bg-card p-6 text-muted-foreground">{reports("noResults")}</p>}
      {results.map((result) => (
        <TestResultSection key={result.id} result={result} subtitle={result.round?.name} />
      ))}
    </>
  );

  const readOnly = (id: string, label: string, text: string) => (
    <section id={id} className="flex scroll-mt-20 flex-col gap-2 rounded-xl border bg-card p-4 sm:p-6 print:border-0 print:p-0">
      <h2 className="text-lg font-semibold">{label}</h2>
      <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{text || t("empty")}</p>
    </section>
  );

  return (
    <>
      <PrintExpander />
      <PageHeader
        title={formatFullName(user)}
        crumb={formatFullName(user)}
        description={formatWorkInfo(user) || undefined}
        back={{ href: `${base}/reports`, label: reports("title") }}
        actions={
          <>
            <PrintButton />
            {write && <SaveVersionButton userId={user.id} />}
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:gap-4 print:border-0 print:p-0">
        <UserAvatar user={user} className="h-14 w-14 print:hidden" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="text-sm text-muted-foreground">
            {t("covers", { count: results.length })}
            {rounds.length > 0 && ` · ${t("rounds", { names: rounds.join(", ") })}`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {latest ? (
              <Badge variant={changed ? "outline" : "secondary"}>
                {changed
                  ? t("changedSince", { version: latest.version })
                  : t("versionOn", { version: latest.version, date: date(latest.createdAt) })}
              </Badge>
            ) : (
              <Badge variant="outline">{t("noVersion")}</Badge>
            )}
            <span className="hidden text-xs text-muted-foreground print:inline">{t("printedOn", { date: date(new Date()) })}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <ReportOutline
          items={[
            { id: "background", label: t("background") },
            ...results.map((result) => ({ id: `result-${result.id}`, label: result.testName, hint: date(result.createdAt) })),
            { id: "conclusion", label: t("conclusion") },
            ...(versions.length ? [{ id: "versions", label: t("versions") }] : []),
          ]}
        />
        <div className="flex min-w-0 flex-col gap-6">
          {write ? (
            <ReportEditor userId={user.id} initial={{ background, conclusion }}>
              {sections}
            </ReportEditor>
          ) : (
            <>
              {readOnly("background", t("background"), background)}
              {sections}
              {readOnly("conclusion", t("conclusion"), conclusion)}
            </>
          )}

          {versions.length > 0 && (
            <section id="versions" className="flex scroll-mt-20 flex-col gap-2 rounded-xl border bg-card p-4 sm:p-6 print:hidden">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <History className="h-4 w-4" aria-hidden />
                {t("versions")}
              </h2>
              <ul className="divide-y">
                {versions.map((version) => (
                  <li key={version.id}>
                    <Link
                      href={`${base}/reports/${user.id}/versions/${version.version}`}
                      className="flex items-center justify-between gap-3 py-2 text-sm hover:text-primary"
                    >
                      <span className="font-medium">{t("versionLabel", { version: version.version })}</span>
                      <span className="text-muted-foreground">{date(version.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
