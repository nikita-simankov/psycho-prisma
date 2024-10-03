import { findAllFormSubmissionsByFormId } from "@/actions/form-submission/find-all-form-submissions-by-form-id-action";
import { findUserById } from "@/actions/user/find-user-by-id-action";
import { ResultCard } from "./result-card";

type PathParams = {
  params: {
    formId: string;
  };
};

export default async function ResultPage({ params }: PathParams) {
  const results = await findAllFormSubmissionsByFormId(params.formId);

  return (
    <div className="p-12 flex flex-col gap-6">
      {results.map(async (result) => {
        const user = await findUserById(result.userId);

        return (
          <ResultCard
            user={user!}
            formId={result.formId}
            resultId={result.id}
          />
        );
      })}
    </div>
  );
}
