"use client";

import { findFormById } from "@/actions/form/find-form-by-id-action";
import { DataTable } from "@/components/data-table";
import { FormQuestion, FormQuestionResponse } from "@/utils/constants";
import { FormSubmission } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";

type Properties = {
  formId: string;
  submissions: FormQuestionResponse[];
};

export const FormResponseTable: React.FC<Properties> = ({
  formId,
  submissions,
}) => {
  return (
    <DataTable
      columns={[
        {
          header: "№ Вопроса",
          cell: ({ row }) => {
            return row.original.fieldId;
          },
        },
        {
          header: "Текст вопроса",
          cell: ({ row }) => {
            const form = useQuery({
              queryKey: ["find-form-by-id"],
              queryFn: () => findFormById(formId),
            });

            if (form.isFetched) {
              const formQuestions = JSON.parse(
                form.data?.questions!
              ) as FormQuestion[];

              return formQuestions.filter(
                (question) => question.id === row.original.fieldId
              )[0].text;
            }
          },
        },
        {
          header: "Ответ",
          cell: ({ row }) => {
            return row.original.response;
          },
        },
      ]}
      data={submissions}
    />
  );
};
