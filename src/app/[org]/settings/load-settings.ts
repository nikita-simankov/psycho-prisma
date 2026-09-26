import { findAllTests } from "@/actions/test/find-all-tests-action";
import { ensureMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { parseCustomFields } from "@/utils/profile-fields";

// Everything the settings form edits, and the tests people may be shown their own results for.
export async function loadSettings() {
  const context = await ensureMember("manageSettings");
  const { organization } = context;
  const tests = (await findAllTests()).filter((test) => !test.sensitive).sort((a, b) => a.name.localeCompare(b.name));
  const { feedbackTestIds, customFields, retentionMonths, candidateRetentionMonths } = await prisma.organization.findUniqueOrThrow({
    where: { id: organization.id },
    select: { feedbackTestIds: true, customFields: true, retentionMonths: true, candidateRetentionMonths: true },
  });

  return {
    context,
    initial: {
      name: organization.name,
      privacyContact: organization.privacyContact,
      respondentFeedback: organization.respondentFeedback,
      feedbackTestIds: JSON.parse(feedbackTestIds) as string[],
      customFields: parseCustomFields(customFields),
      retentionMonths,
      candidateRetentionMonths,
    },
    tests: tests.map((test) => ({ id: test.id, name: test.name })),
  };
}
