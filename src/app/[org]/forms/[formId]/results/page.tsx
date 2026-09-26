import { findFormSubmissionsPage } from "@/actions/form-submission/find-form-submissions-page-action";
import { Pager } from "@/components/pager";
import { pageCount, pageFrom } from "@/utils/pagination";
import { findFormById } from "@/actions/form/find-form-by-id-action";
import { findUsersByIds } from "@/actions/user/find-all-users-action";
import { SubmissionList } from "@/components/submission-list";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { ensureMember } from "@/utils/authentication";
import { can } from "@/utils/roles";
import { Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { organizationBase } from "@/utils/organization-path";

type PathParams = {
  params: Promise<{
    formId: string;
  }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function FormResultsPage(props: PathParams) {
  const params = await props.params;
  const page = pageFrom((await props.searchParams).page);
  const base = await organizationBase();
  const t = await getTranslations("results");
  const section = await getTranslations("dashboard.forms");
  const [form, { items: submissions, total }] = await Promise.all([
    findFormById(params.formId),
    findFormSubmissionsPage(params.formId, page),
  ]);

  if (!form) {
    notFound();
  }

  const users = await findUsersByIds([...new Set(submissions.map((submission) => submission.userId))]);
  const usersById = new Map(users.map((user) => [user.id, user]));
  const { membership } = await ensureMember("viewDashboard");

  if (!can(membership.role, "viewIndividualResults")) {
    return (
      <>
        <PageHeader title={form.name} back={{ href: `${base}/forms`, label: section("back") }} />
        <Card>
          <EmptyState icon={Lock} title={t("restrictedTitle")} description={t("restrictedText")} />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={form.name}
        description={t("count", { count: total })}
        back={{ href: `${base}/forms`, label: section("back") }}
      />
      <SubmissionList
        items={submissions.flatMap((submission) => {
          const user = usersById.get(submission.userId);

          return user
            ? [
                {
                  id: submission.id,
                  href: `${base}/forms/${form.id}/results/${submission.id}`,
                  createdAt: submission.createdAt,
                  user,
                },
              ]
            : [];
        })}
      />
      <Pager page={page} pages={pageCount(total)} path={`${base}/forms/${form.id}/results`} />
    </>
  );
}
