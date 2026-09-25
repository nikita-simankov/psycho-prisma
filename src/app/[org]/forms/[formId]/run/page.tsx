import { findFormById } from "@/actions/form/find-form-by-id-action";
import { FormRunner } from "@/components/form-runner";
import { ensureMember } from "@/utils/authentication";
import { findDraft } from "@/utils/drafts";
import { organizationBase } from "@/utils/organization-path";
import { notFound } from "next/navigation";

type PathParams = {
  params: {
    formId: string;
  };
};

export default async function RunForm({ params }: PathParams) {
  const base = organizationBase();
  const form = await findFormById(params.formId);

  if (!form) {
    notFound();
  }

  const { user, organization } = await ensureMember();

  return (
    <div className="py-2">
      <FormRunner
        form={form}
        doneHref={`${base}/forms`}
        pauseHref={`${base}/forms`}
        initialDraft={await findDraft(user.id, organization.id, "form", form.id)}
      />
    </div>
  );
}
