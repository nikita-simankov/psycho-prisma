import { findFormById } from "@/actions/form/find-form-by-id-action";
import { FormRunner } from "../components/form-runner";

type PathParams = {
  params: {
    formId: string;
  };
};

export default async function Page({ params }: PathParams) {
  const form = await findFormById(params.formId);

  return (
    <div className="p-12 flex flex-col items-center justify-between gap-6">
      <FormRunner form={form!} />
    </div>
  );
}
