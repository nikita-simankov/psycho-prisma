import { findFormById } from "@/actions/form/find-form-by-id-action";
import { FormRunner } from "@/components/form-runner";
import { notFound } from "next/navigation";

type PathParams = {
  params: {
    formId: string;
  };
};

export default async function RunForm({ params }: PathParams) {
  const form = await findFormById(params.formId);

  if (!form) {
    notFound();
  }

  return (
    <div className="py-2">
      <FormRunner form={form} doneHref="/dashboard/forms" />
    </div>
  );
}
