import { PageHeader } from "@/components/page-header";
import { ensureMember } from "@/utils/authentication";
import { getTranslations } from "next-intl/server";
import { findAllUsers } from "@/actions/user/find-all-users-action";
import { findAllTests } from "@/actions/test/find-all-tests-action";
import { prisma } from "@/utils/database";
import { parseCustomFields } from "@/utils/profile-fields";
import { formatFullName } from "@/utils/user";
import { OwnerControls } from "./owner-controls";
import { Button } from "@/components/ui/button";
import { can } from "@/utils/roles";
import { organizationBase } from "@/utils/organization-path";
import { ScrollText } from "lucide-react";
import Link from "next/link";
import { SettingsForm } from "./settings-form";

export async function generateMetadata() {
  const t = await getTranslations("dashboard.nav");
  return { title: t("settings") };
}

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const { organization, membership, user } = await ensureMember("manageSettings");
  const owner = membership.role === "owner";
  const members = owner ? await findAllUsers() : [];
  const tests = (await findAllTests()).filter((test) => !test.sensitive).sort((a, b) => a.name.localeCompare(b.name));
  const { feedbackTestIds, customFields, retentionMonths, candidateRetentionMonths } = await prisma.organization.findUniqueOrThrow({
    where: { id: organization.id },
    select: { feedbackTestIds: true, customFields: true, retentionMonths: true, candidateRetentionMonths: true },
  });

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          can(membership.role, "viewAudit") && (
            <Button variant="outline" asChild>
              <Link href={`${organizationBase()}/settings/audit`}>
                <ScrollText className="mr-2 h-4 w-4" />
                {t("auditLog")}
              </Link>
            </Button>
          )
        }
      />
      <SettingsForm
        initial={{
          name: organization.name,
          privacyContact: organization.privacyContact,
          respondentFeedback: organization.respondentFeedback,
          feedbackTestIds: JSON.parse(feedbackTestIds) as string[],
          customFields: parseCustomFields(customFields),
          retentionMonths,
          candidateRetentionMonths,
        }}
        tests={tests.map((test) => ({ id: test.id, name: test.name }))}
      />
      {owner && (
        <div className="mt-6">
          <OwnerControls
            organizationName={organization.name}
            candidates={members
              .filter((member) => member.id !== user.id && member.role !== "owner")
              .map((member) => ({ id: member.id, name: formatFullName(member) }))}
          />
        </div>
      )}
    </>
  );
}
