import { findTestById } from "@/actions/test/find-test-by-id-action";
import { findUsersByIds } from "@/actions/user/find-all-users-action";
import { EmptyState } from "@/components/empty-state";
import { FitBadge } from "@/components/hiring/fit";
import { TargetPicker } from "@/components/hiring/target-picker";
import { PageHeader } from "@/components/page-header";
import { StenScale, TargetBracket } from "@/components/ui/sten-scale";
import { auditAs } from "@/utils/audit";
import { ensureMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { chooseTarget, loadTargetProfiles } from "@/utils/hiring";
import { localizedTestsAsAnswered } from "@/utils/instrument-versions";
import { allowedSubmissionWhere } from "@/utils/library";
import { normPosition, type NormPosition } from "@/utils/norms";
import { organizationBase } from "@/utils/organization-path";
import { buildTestResult } from "@/utils/results";
import { bandsByScale, COMPARE_MAX, COMPARE_MIN, profileFit, targetKind, type TargetBand } from "@/utils/target-profiles";
import { formatFullName } from "@/utils/user";
import { Columns3 } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type PathParams = {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ s?: string | string[]; target?: string }>;
};

// A T-score on a continuous track, the size of a sten scale's cells, with the target bracket above.
function TTrack({ position, target, label }: { position: NormPosition; target: TargetBand | null; label: string }) {
  const percent = (value: number) => ((Math.min(position.max, Math.max(position.min, value)) - position.min) / (position.max - position.min)) * 100;
  return (
    <div className="flex flex-col gap-0.5">
      {target && <TargetBracket from={percent(target.min)} to={percent(target.max)} />}
      <div className="relative h-4" role="img" aria-label={label}>
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-muted" />
        <div
          className="absolute inset-y-0 border border-primary/15 bg-accent print:bg-gray-200"
          style={{ left: `${percent(position.averageFrom)}%`, width: `${percent(position.averageTo) - percent(position.averageFrom)}%` }}
        />
        <div className="absolute inset-y-0 w-2 -translate-x-1/2 bg-primary print:bg-gray-800" style={{ left: `${percent(position.value)}%` }} />
      </div>
    </div>
  );
}

// Two to four people's results on one test, scale by scale, with the target profile's ranges.
export default async function ComparePage(props: PathParams) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const context = await ensureMember("viewIndividualResults");
  const base = await organizationBase();
  const t = await getTranslations("hiring.compare");
  const chart = await getTranslations("profileChart");
  const results = await getTranslations("results");
  const format = await getFormatter();
  const test = await findTestById(params.testId);

  if (!test) {
    notFound();
  }

  const ids = Array.from(new Set([searchParams.s ?? []].flat())).slice(0, COMPARE_MAX + 1);
  const submissions =
    ids.length >= COMPARE_MIN && ids.length <= COMPARE_MAX
      ? await prisma.testSubmission.findMany({ where: { AND: [await allowedSubmissionWhere(context), { id: { in: ids }, testId: test.id }] } })
      : [];
  const back = { href: `${base}/tests/${test.id}/results`, label: results("title") };

  if (submissions.length < COMPARE_MIN) {
    return (
      <>
        <PageHeader title={t("title")} crumb={t("title")} eyebrow={test.name} back={back} />
        <EmptyState icon={Columns3} title={t("tooFew", { min: COMPARE_MIN, max: COMPARE_MAX })} description={t("tooFewText")} />
      </>
    );
  }

  const rawTest = await prisma.test.findUniqueOrThrow({ where: { id: test.id } });
  const kind = targetKind(test.strategy);
  const [users, testFor, profiles] = await Promise.all([
    findUsersByIds(submissions.map((submission) => submission.userId)),
    localizedTestsAsAnswered([rawTest], submissions, await getLocale()),
    kind && !test.sensitive ? loadTargetProfiles(context.organization.id, test.id) : Promise.resolve([]),
  ]);
  const target = chooseTarget(profiles, searchParams.target);
  const bands = bandsByScale(target?.bands);
  const usersById = new Map(users.map((user) => [user.id, user]));
  // In the order the people were picked.
  const people = ids.flatMap((id) => {
    const submission = submissions.find((entry) => entry.id === id);
    const user = submission && usersById.get(submission.userId);
    if (!submission || !user) return [];
    const result = buildTestResult(testFor(submission) ?? rawTest, submission);
    return [{ submission, user, result, fit: target ? profileFit(result.rows, target.bands) : null }];
  });
  // Every scale any of them has, in the test's order.
  const scales = Array.from(new Map(people.flatMap(({ result }) => result.rows.map((row) => [row.scaleId, row.scaleName] as const))).entries());

  for (const { submission } of people) {
    await auditAs(context, "viewTestResult", { subjectId: submission.userId, detail: { testId: test.id, submissionId: submission.id } });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        className="mb-0"
        title={t("title")}
        crumb={t("title")}
        eyebrow={test.name}
        description={t("description", { count: people.length })}
        back={back}
        actions={<TargetPicker profiles={profiles} current={target?.id ?? null} />}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-foreground/80 align-bottom">
              <th scope="col" className="w-44 py-2 pr-4 text-left font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                {t("scale")}
              </th>
              {people.map(({ submission, user, fit }) => (
                <th key={submission.id} scope="col" className="px-3 py-2 text-left font-normal">
                  <Link href={`${base}/tests/${test.id}/results/${submission.id}`} className="font-medium hover:text-primary">
                    {formatFullName(user)}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {format.dateTime(submission.createdAt, { dateStyle: "medium" })}
                    {fit && <FitBadge fit={fit} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scales.map(([scaleId, scaleName]) => {
              const band = bands.get(scaleId) ?? null;
              return (
                <tr key={scaleId} className="border-b align-top">
                  <th scope="row" className="py-3 pr-4 text-left font-normal">
                    {scaleName}
                    {band && <span className="block font-mono text-xs text-success">{t("target", { from: band.min, to: band.max })}</span>}
                  </th>
                  {people.map(({ submission, user, result }) => {
                    const row = result.rows.find((entry) => entry.scaleId === scaleId);
                    const position = row ? normPosition(row) : null;
                    const label = position
                      ? `${formatFullName(user)}: ${chart("aria", { scale: scaleName, kind: chart(`kind.${position.kind}`), value: position.value, band: chart(`band.${position.band}`) })}`
                      : "";
                    return (
                      <td key={submission.id} className="px-3 py-3">
                        {position ? (
                          <div className="flex flex-col gap-1">
                            {position.kind === "sten" ? (
                              <StenScale value={position.value} sem={null} target={band} label={label} />
                            ) : (
                              <TTrack position={position} target={band} label={label} />
                            )}
                            <span className="font-mono text-xs tabular-nums">
                              {position.value} · {chart(`band.${position.band}`)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-xs tabular-nums text-muted-foreground">{row ? row.correctedGrade ?? row.rawGrade ?? "—" : "—"}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {kind && <p className="text-xs text-muted-foreground">{[chart(`legend.${kind}`), bands.size ? chart("legend.target") : ""].filter(Boolean).join(" ")}</p>}
    </div>
  );
}
