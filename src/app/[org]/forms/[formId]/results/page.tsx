import { findAllFormSubmissionsByFormId } from "@/actions/form-submission/find-all-form-submissions-by-form-id-action";
import { findFormById } from "@/actions/form/find-form-by-id-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { SubmissionList } from "@/components/submission-list";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { organizationBase } from "@/utils/organization-path";

type PathParams = {
  params: {
    formId: string;
  };
};

export default async function FormResultsPage({ params }: PathParams) {
  const base = organizationBase();
  const t = await getTranslations("results");
  const section = await getTranslations("dashboard.forms");
  const [form, submissions, users] = await Promise.all([
    findFormById(params.formId),
    findAllFormSubmissionsByFormId(params.formId),
    findAllUsers(),
  ]);

  if (!form) {
    notFound();
  }

  const usersById = new Map(users.map((user) => [user.id, user]));

  return (
    <>
      <PageHeader
        title={form.name}
        description={t("count", { count: submissions.length })}
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
    </>
  );
}
