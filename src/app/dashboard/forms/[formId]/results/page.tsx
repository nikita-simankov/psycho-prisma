import { findAllFormSubmissionsByFormId } from "@/actions/form-submission/find-all-form-submissions-by-form-id-action";
import { findFormById } from "@/actions/form/find-form-by-id-action";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { SubmissionList } from "@/components/submission-list";
import { Separator } from "@/components/ui/separator";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type PathParams = {
  params: {
    formId: string;
  };
};

export default async function FormResultsPage({ params }: PathParams) {
  const t = await getTranslations("results");
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
    <div className="p-12 flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-wide">
        {t("formTitle", { name: form.name })}
      </h1>
      <Separator />
      <SubmissionList
        items={submissions.flatMap((submission) => {
          const user = usersById.get(submission.userId);

          return user
            ? [
                {
                  id: submission.id,
                  href: `/dashboard/forms/${form.id}/results/${submission.id}`,
                  createdAt: submission.createdAt,
                  user,
                },
              ]
            : [];
        })}
      />
    </div>
  );
}
