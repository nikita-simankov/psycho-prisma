import { findTestById } from "@/actions/test/find-test-by-id-action";
import { ensureMember } from "@/utils/authentication";
import { TestQuestion } from "@/utils/constants";
import { findDraft } from "@/utils/drafts";
import { roundJourney } from "@/utils/round-journey";
import { notFound } from "next/navigation";
import { TestRunner } from "../components/test-runner";

type PathParams = {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ assignment?: string }>;
};

export default async function Page(props: PathParams) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const test = await findTestById(params.testId);

  if (!test) {
    notFound();
  }

  const { user, organization } = await ensureMember();
  const questions = JSON.parse(test.questions) as TestQuestion[];
  const journey = await roundJourney(searchParams.assignment, user.id, { kind: "test", id: test.id });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <TestRunner
        test={{ id: test.id, name: test.name, ttc: test.ttc }}
        questions={questions}
        assignmentId={searchParams.assignment}
        pauseHref="/assessments"
        doneHref={journey?.nextHref ?? "/assessments?done=1"}
        initialDraft={await findDraft(user.id, organization.id, "test", test.id)}
      />
    </div>
  );
}
