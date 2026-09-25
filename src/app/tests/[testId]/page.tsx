import { findTestById } from "@/actions/test/find-test-by-id-action";
import { IntroCard } from "@/components/intro-card";
import { ensureMember } from "@/utils/authentication";
import { findDraft } from "@/utils/drafts";
import { notFound } from "next/navigation";

type PathParams = {
  params: { testId: string };
  searchParams: { assignment?: string };
};

export default async function TestPage({ params, searchParams }: PathParams) {
  const test = await findTestById(params.testId);

  if (!test) {
    notFound();
  }

  const { user, organization } = await ensureMember();
  const draft = await findDraft(user.id, organization.id, "test", test.id);
  const query = searchParams.assignment ? `?assignment=${encodeURIComponent(searchParams.assignment)}` : "";

  return (
    <IntroCard
      name={test.name}
      description={test.description}
      instruction={test.instruction}
      questionCount={JSON.parse(test.questions).length}
      minutes={test.ttc}
      backHref="/assessments"
      answered={draft ? Object.keys(draft.answers).length : 0}
      startHref={`/tests/${test.id}/run${query}`}
    />
  );
}
