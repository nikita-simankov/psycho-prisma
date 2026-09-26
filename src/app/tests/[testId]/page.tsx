import { findTestById } from "@/actions/test/find-test-by-id-action";
import { IntroCard } from "@/components/intro-card";
import { ensureMember } from "@/utils/authentication";
import { DataPromise } from "@/components/data-promise";
import { findDraft } from "@/utils/drafts";
import { roundJourney } from "@/utils/round-journey";
import { notFound } from "next/navigation";

type PathParams = {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ assignment?: string }>;
};

export default async function TestPage(props: PathParams) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const test = await findTestById(params.testId);

  if (!test) {
    notFound();
  }

  const { user, organization } = await ensureMember();
  const [draft, journey] = await Promise.all([
    findDraft(user.id, organization.id, "test", test.id),
    roundJourney(searchParams.assignment, user.id, { kind: "test", id: test.id }),
  ]);
  const query = searchParams.assignment ? `?assignment=${encodeURIComponent(searchParams.assignment)}` : "";

  return (
    <IntroCard
      name={test.name}
      description={test.description}
      instruction={test.instruction}
      questionCount={JSON.parse(test.questions).length}
      minutes={test.ttc}
      backHref="/assessments"
      journey={journey}
      promise={journey ? <DataPromise organizationId={organization.id} /> : undefined}
      answered={draft ? Object.keys(draft.answers).length : 0}
      startHref={`/tests/${test.id}/run${query}`}
    />
  );
}
