import { findFormById } from "@/actions/form/find-form-by-id-action";
import { FormRunner } from "@/components/form-runner";
import { notFound } from "next/navigation";

type PathParams = {
  params: { formId: string };
  searchParams: { assignment?: string };
};

export default async function Page({ params, searchParams }: PathParams) {
  const form = await findFormById(params.formId);

  if (!form) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <FormRunner form={form} doneHref="/assessments?done=1" assignmentId={searchParams.assignment} />
    </div>
  );
}
