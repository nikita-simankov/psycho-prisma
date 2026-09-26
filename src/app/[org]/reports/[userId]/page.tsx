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
      {results.length === 0 && <p className="border-t border-foreground/80 pt-5 text-muted-foreground">{reports("noResults")}</p>}
      {results.map((result) => (
        <TestResultSection key={result.id} result={result} subtitle={result.round?.name} />
      ))}
    </>
  );

  const readOnly = (id: string, label: string, text: string) => (
    <section id={id} className="flex scroll-mt-20 flex-col gap-3 border-t border-foreground/80 pt-5 print:border-gray-800">
      <h2 className="text-2xl font-medium">{label}</h2>
      <p className="max-w-[68ch] whitespace-pre-line text-[1.0625rem] leading-relaxed">{text || <span className="text-muted-foreground">{t("empty")}</span>}</p>
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

      <div className="-mt-4 mb-10 flex flex-col gap-3 border-y py-3 sm:flex-row sm:items-center sm:gap-4">
        <UserAvatar user={user} className="size-10 print:hidden" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-muted-foreground">
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

      <div className="grid gap-10 lg:grid-cols-[12rem_minmax(0,1fr)] print:block">
        <ReportOutline
          items={[
            { id: "background", label: t("background") },
            ...results.map((result) => ({ id: `result-${result.id}`, label: result.testName, hint: date(result.createdAt) })),
            { id: "conclusion", label: t("conclusion") },
            ...(versions.length ? [{ id: "versions", label: t("versions") }] : []),
          ]}
        />
        <div className="flex min-w-0 flex-col gap-12 print:gap-8">
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
            <section id="versions" className="flex scroll-mt-20 flex-col gap-3 border-t border-foreground/80 pt-5 print:border-gray-800 print:hidden">
              <h2 className="flex items-center gap-2 text-2xl font-medium">
                <History className="size-4 text-muted-foreground" aria-hidden />
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
                      <span className="font-mono text-xs text-muted-foreground">{date(version.createdAt)}</span>
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
