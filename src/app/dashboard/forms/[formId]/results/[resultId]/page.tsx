import PrintButton from "@/app/dashboard/components/print-button";

import { Textarea } from "@/components/ui/textarea";
import { FormResponseTable } from "./form-response-table";
import { FormQuestionResponse } from "@/utils/constants";
import { findFormSubmissionById } from "@/actions/form-submission/find-form-submission-by-id-action";

type PathParams = {
  params: {
    resultId: string;
  };
};

export default async function ViewFormResult({ params }: PathParams) {
  const result = await findFormSubmissionById(params.resultId);
  const submissions = JSON.parse(result?.submission!) as FormQuestionResponse[];

  return (
    <div className="p-12 flex flex-col gap-6">
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-2xl font-bold">Список ответов</h1>
        <PrintButton />
      </div>
      <FormResponseTable formId={result?.formId!} submissions={submissions} />
      <Textarea placeholder="Заметки о военнослужащем" rows={10} />
    </div>
  );
}
