import { TestEditor } from "@/components/studio/instrument-editors";
import { ItemAnalysis } from "@/components/studio/item-analysis";
import type { TestQuestionResponse } from "@/utils/constants";
import { prisma } from "@/utils/database";
import { testContentOf } from "@/utils/instrument-content";
import { analyzeItems, MIN_ITEM_SAMPLE } from "@/utils/psychometrics";
import { PageHeader } from "@/components/page-header";
import { organizationBase } from "@/utils/organization-path";
import { can } from "@/utils/roles";
import { loadEditableTest } from "@/utils/studio-access";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("studio");
  return { title: t("editTest") };
}

export default async function EditTestPage(props: { params: Promise<{ testId: string }> }) {
  const params = await props.params;
  const { context, row, content } = await loadEditableTest(params.testId);
  const t = await getTranslations("studio");
  const common = await getTranslations("common");
  const base = await organizationBase();
  const backHref = row.version === 0 ? `${base}/tests` : `${base}/tests/${row.id}`;
  // Item statistics describe the published version, from the answers given to exactly that version.
  const published = row.version > 0 ? testContentOf(row) : null;
  const submissions = published
    ? await prisma.testSubmission.findMany({
        where: { organizationId: context.organization.id, testId: row.id, testVersion: row.version },
        select: { submission: true },
      })
    : [];
  const analysis =
    published && submissions.length >= MIN_ITEM_SAMPLE
      ? analyzeItems(
          published.scales,
          submissions.map((submission) => JSON.parse(submission.submission) as TestQuestionResponse[])
        )
      : null;

  return (
    <>
      <PageHeader title={t("editTest")} crumb={row.name} back={{ href: backHref, label: common("back") }} className="mb-2" />
      <TestEditor
        id={row.id}
        version={row.version}
        hasDraft={Boolean(row.draft)}
        backHref={`${base}/tests/${row.id}`}
        initial={content}
        settings={{ sensitive: row.sensitive, retestDays: row.retestDays }}
        canMarkSensitive={can(context.membership.role, "viewSensitive")}
      />
      {published && (
        <div className="mt-12">
          <ItemAnalysis analysis={analysis} responses={submissions.length} version={row.version} questions={published.questions} />
        </div>
      )}
    </>
  );
}
