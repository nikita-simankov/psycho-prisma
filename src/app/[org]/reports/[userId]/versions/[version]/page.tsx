import { PageHeader } from "@/components/page-header";
import { PrintExpander } from "@/components/results/print-expander";
import { TestResultSection } from "@/components/results/test-result-section";
import { prisma } from "@/utils/database";
import { organizationBase } from "@/utils/organization-path";
import { formatFullName, formatWorkInfo } from "@/utils/user";
import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import PrintButton from "../../../../components/print-button";
import { loadReport } from "../../load-report";
import { auditAs } from "@/utils/audit";

type PathParams = { params: Promise<{ userId: string; version: string }> };

// A saved version exactly as it was: its text and the results it covered.
export default async function ReportVersionPage(props: PathParams) {
  const params = await props.params;
  const base = await organizationBase();
  const t = await getTranslations("report");
  const format = await getFormatter();
  const number = Number(params.version);
  const first = await loadReport(params.userId, []);
  const version = Number.isInteger(number)
    ? await prisma.reportVersion.findUnique({
        where: {
          organizationId_userId_version: {
            organizationId: first.context.organization.id,
            userId: params.userId,
            version: number,
          },
        },
      })
    : null;

  if (!first.user || !version) {
    notFound();
  }

  await auditAs(first.context, "viewReportVersion", { subjectId: params.userId, detail: { version: version.version } });
  const ids = JSON.parse(version.submissionIds) as string[];
  const { results } = ids.length ? await loadReport(params.userId, ids) : { results: [] };
  const text = (label: string, value: string) => (
    <section className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:p-6 print:border-0 print:p-0">
      <h2 className="text-lg font-semibold">{label}</h2>
      <p className="whitespace-pre-line leading-relaxed">{value || t("empty")}</p>
    </section>
  );

  return (
    <>
      <PrintExpander />
      <PageHeader
        title={formatFullName(first.user)}
        crumb={t("versionLabel", { version: version.version })}
        description={`${t("versionOn", { version: version.version, date: format.dateTime(version.createdAt, { dateStyle: "medium" }) })}${
          formatWorkInfo(first.user) ? ` · ${formatWorkInfo(first.user)}` : ""
        }`}
        back={{ href: `${base}/reports/${params.userId}`, label: t("current") }}
        actions={<PrintButton />}
      />
      <div className="flex max-w-4xl flex-col gap-6">
        {text(t("background"), version.background)}
        {results.map((result) => (
          <TestResultSection key={result.id} result={result} subtitle={result.round?.name} showAnswers={false} />
        ))}
        {text(t("conclusion"), version.conclusion)}
      </div>
    </>
  );
}
