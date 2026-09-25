import { findFormSubmissionById } from "@/actions/form-submission/find-form-submission-by-id-action";
import { findFormById } from "@/actions/form/find-form-by-id-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
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
    <div className="p-12 flex flex-col gap-6">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{form.name}</h1>
          {user && <p className="text-muted-foreground">{formatFullName(user)}</p>}
        </div>
        <PrintButton />
      </div>
      <FormResponseTable rows={rows} />
      <Textarea placeholder={t("notesPlaceholder")} rows={10} />
    </div>
  );
}
