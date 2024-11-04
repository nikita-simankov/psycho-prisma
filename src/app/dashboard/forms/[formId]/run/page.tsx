import { findFormById } from "@/actions/form/find-form-by-id-action";
import { FormRunner } from "./form-runner";

type PathParams = {
  params: {
    formId: string;
  };
};

export default async function RunForm({ params }: PathParams) {
  const form = await findFormById(params.formId);

  return (
    <div className="p-10">
      <FormRunner form={form!} />
    </div>
  );
}
