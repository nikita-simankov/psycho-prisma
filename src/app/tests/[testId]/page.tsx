import { findTestById } from "@/actions/test/find-test-by-id-action";
import { IntroCard } from "@/components/intro-card";
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

  const query = searchParams.assignment ? `?assignment=${encodeURIComponent(searchParams.assignment)}` : "";

  return (
    <IntroCard
      name={test.name}
      description={test.description}
      instruction={test.instruction}
      questionCount={JSON.parse(test.questions).length}
      minutes={test.ttc}
      backHref="/assessments"
      startHref={`/tests/${test.id}/run${query}`}
    />
  );
}
