import { findAllTests } from "@/actions/test/find-all-tests-action";
import { ensureMember } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { parseCustomFields } from "@/utils/profile-fields";
import { can } from "@/utils/roles";
import { parseRules, parseSupportLinks } from "@/utils/wellbeing";

// Everything the settings form edits, the tests people may be shown their own results for, and
// the tests wellbeing rules can read (clinical screens only for roles that may see them).
export async function loadSettings() {
  const context = await ensureMember("manageSettings");
  const { organization, membership } = context;
  const all = (await findAllTests()).sort((a, b) => a.name.localeCompare(b.name));
  const tests = all.filter((test) => !test.sensitive);
  const ruleTests = all.filter((test) => !test.sensitive || can(membership.role, "viewSensitive"));
  const settings = await prisma.organization.findUniqueOrThrow({
    where: { id: organization.id },
    select: {
      feedbackTestIds: true,
      customFields: true,
      retentionMonths: true,
      candidateRetentionMonths: true,
      quietHours: true,
      timeZone: true,
      wellbeingRules: true,
      digestEnabled: true,
      digestWeekday: true,
      supportText: true,
      supportContacts: true,
      supportLinks: true,
    },
  });
  const visible = new Set(ruleTests.map((test) => test.id));

  return {
    context,
    initial: {
      name: organization.name,
      privacyContact: organization.privacyContact,
      respondentFeedback: organization.respondentFeedback,
      feedbackTestIds: JSON.parse(settings.feedbackTestIds) as string[],
      customFields: parseCustomFields(settings.customFields),
      retentionMonths: settings.retentionMonths,
      candidateRetentionMonths: settings.candidateRetentionMonths,
      quietHours: settings.quietHours,
      timeZone: settings.timeZone,
      // Rules on screens this person may not see stay as they are when they save.
      wellbeingRules: parseRules(settings.wellbeingRules).filter((rule) => visible.has(rule.testId)),
      digestEnabled: settings.digestEnabled,
      digestWeekday: settings.digestWeekday,
      supportText: settings.supportText,
      supportContacts: settings.supportContacts,
      supportLinks: parseSupportLinks(settings.supportLinks),
    },
    tests: tests.map((test) => ({ id: test.id, name: test.name })),
    ruleTests: ruleTests.map((test) => ({
      id: test.id,
      name: test.name,
      scales: (JSON.parse(test.scales) as { id: number; name: string }[]).map((scale) => ({ id: scale.id, name: scale.name })),
    })),
  };
}
