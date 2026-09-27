import { CompareForm } from "@/components/hiring/compare-form";
import { Section } from "@/components/page-templates";
import { SubmissionList } from "@/components/submission-list";
import type { Context } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { chooseTarget, loadTargetProfiles } from "@/utils/hiring";
import { localizedTestsAsAnswered } from "@/utils/instrument-versions";
import { allowedSubmissionWhere, libraryWhere } from "@/utils/library";
import type { RoundItem } from "@/utils/rounds";
import { buildTestResult } from "@/utils/results";
import { profileFit, targetKind } from "@/utils/target-profiles";
import type { Member } from "@/utils/user";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

// A hiring round's results per test: each candidate's fit with the test's latest target profile,
// and checkboxes to compare two to four of them side by side.
export async function CandidateResults({
  context,
  base,
  items,
  assignmentIds,
  members,
}: {
  context: Context;
  base: string;
  items: RoundItem[];
  assignmentIds: string[];
  members: Member[];
}) {
  const t = await getTranslations("hiring.round");
  const targets = await getTranslations("hiring.targets");
  const locale = await getLocale();
  const organizationId = context.organization.id;
  const testIds = items.filter((item) => item.kind === "test").map((item) => item.id);
  const [tests, submissions] = await Promise.all([
    prisma.test.findMany({ where: { id: { in: testIds }, AND: [libraryWhere(organizationId)] } }),
    prisma.testSubmission.findMany({
      where: { AND: [await allowedSubmissionWhere(context), { assignmentId: { in: assignmentIds }, testId: { in: testIds } }] },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const testFor = await localizedTestsAsAnswered(tests, submissions, locale);
  const membersById = new Map(members.map((member) => [member.id, member]));
  const ordered = testIds.flatMap((id) => tests.filter((test) => test.id === id));

  const sections = await Promise.all(
    ordered.map(async (test) => {
      const own = submissions.filter((submission) => submission.testId === test.id);
      const targetable = targetKind(test.strategy) !== null && !test.sensitive;
      const target = targetable ? chooseTarget(await loadTargetProfiles(organizationId, test.id), undefined) : null;
      const name = testFor(own[0] ?? { testId: test.id, testVersion: test.version })?.name ?? test.name;
      const list = (
        <SubmissionList
          selectName={own.length > 1 ? "s" : undefined}
          items={own.flatMap((submission) => {
            const user = membersById.get(submission.userId);
            const answered = testFor(submission);
            if (!user || !answered) return [];
            const result = buildTestResult(answered, submission);
            return [
              {
                id: submission.id,
                href: `${base}/tests/${test.id}/results/${submission.id}`,
                createdAt: submission.createdAt,
                user,
                profile: result.rows,
                quality: result.quality,
                fit: target ? profileFit(result.rows, target.bands) : undefined,
              },
            ];
          })}
        />
      );

      return (
        <Section
          key={test.id}
          title={name}
          description={target ? t("fitWith", { profile: target.name }) : targetable ? t("noProfile") : undefined}
          actions={
            targetable && (
              <Link href={`${base}/tests/${test.id}/targets`} className="text-sm text-primary hover:underline">
                {targets("title")}
              </Link>
            )
          }
        >
          {own.length > 1 ? (
            <CompareForm action={`${base}/tests/${test.id}/compare`} target={target?.id}>
              {list}
            </CompareForm>
          ) : (
            list
          )}
        </Section>
      );
    })
  );

  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-medium">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      {sections}
    </div>
  );
}
