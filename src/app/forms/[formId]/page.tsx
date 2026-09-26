import { findFormById } from "@/actions/form/find-form-by-id-action";
import { IntroCard } from "@/components/intro-card";
import { ensureMember } from "@/utils/authentication";
import { findDraft } from "@/utils/drafts";
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
  const draft = await findDraft(user.id, organization.id, "form", form.id);
  const query = searchParams.assignment ? `?assignment=${encodeURIComponent(searchParams.assignment)}` : "";

  return (
    <IntroCard
      name={form.name}
      description={form.description}
      questionCount={JSON.parse(form.questions).length}
      minutes={form.ttc}
      backHref="/assessments"
      answered={draft ? Object.keys(draft.answers).length : 0}
      startHref={`/forms/${form.id}/run${query}`}
    />
  );
}
