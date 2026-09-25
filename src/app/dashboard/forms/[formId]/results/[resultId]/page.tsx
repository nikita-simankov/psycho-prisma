import { findFormSubmissionById } from "@/actions/form-submission/find-form-submission-by-id-action";
import { findFormById } from "@/actions/form/find-form-by-id-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import { PageHeader } from "@/components/page-header";
import PrintButton from "@/app/dashboard/components/print-button";
import { Textarea } from "@/components/ui/textarea";
import { FormQuestion, FormQuestionResponse } from "@/utils/constants";
import { formatFullName } from "@/utils/user";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { FormResponseTable } from "./form-response-table";

type PathParams = {
  params: {
    formId: string;
    resultId: string;
  };
};

export default async function ViewFormResult({ params }: PathParams) {
  const t = await getTranslations("results");
  const results = t;
  const result = await findFormSubmissionById(params.resultId);

  if (!result || result.formId !== params.formId) {
    notFound();
  }

  const [form, user] = await Promise.all([
    findFormById(result.formId),
    findUserById(result.userId),
  ]);

  if (!form) {
    notFound();
  }

  const questions = JSON.parse(form.questions) as FormQuestion[];
  const responses = JSON.parse(result.submission) as FormQuestionResponse[];
  const rows = responses.map((response) => ({
    id: response.fieldId,
    question: questions.find((question) => question.id === response.fieldId)?.text ?? "",
    answer: response.response,
  }));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        className="mb-2"
        title={form.name}
        description={user ? formatFullName(user) : undefined}
        back={{ href: `/dashboard/forms/${form.id}/results`, label: results("title") }}
        actions={<PrintButton />}
      />
      <FormResponseTable rows={rows} />
      <Textarea placeholder={t("notesPlaceholder")} rows={10} />
    </div>
  );
}
