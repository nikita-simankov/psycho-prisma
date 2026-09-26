import { findFormById } from "@/actions/form/find-form-by-id-action";
import { FormRunner } from "@/components/form-runner";
import { ensureMember } from "@/utils/authentication";
import { findDraft } from "@/utils/drafts";
import { roundJourney } from "@/utils/round-journey";
import { notFound } from "next/navigation";

type PathParams = {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ assignment?: string }>;
};

export default async function Page(props: PathParams) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const form = await findFormById(params.formId);

  if (!form) {
    notFound();
  }

  const { user, organization } = await ensureMember();
  const journey = await roundJourney(searchParams.assignment, user.id, { kind: "form", id: form.id });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <FormRunner
        form={form}
        doneHref={journey?.nextHref ?? "/assessments?done=1"}
        pauseHref="/assessments"
        assignmentId={searchParams.assignment}
        initialDraft={await findDraft(user.id, organization.id, "form", form.id)}
      />
    </div>
  );
}
