import { RespondentHeader } from "@/components/respondent-header";
import { PageHeader } from "@/components/page-header";
import { ensureUser, isLinkSession } from "@/utils/authentication";
import { redirect } from "next/navigation";
import { prisma } from "@/utils/database";
import { getTranslations } from "next-intl/server";
import { EmailForm, OrganizationList, PasswordForm, ProfileForm, YourData } from "./account-forms";

export async function generateMetadata() {
  const t = await getTranslations("account");
  return { title: t("title") };
}

export default async function AccountPage() {
  const user = await ensureUser();
  if (await isLinkSession()) {
    redirect("/auth/sign-in?reason=link&next=/account");
  }
  const t = await getTranslations("account");
  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { organization: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <RespondentHeader />
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        <PageHeader title={t("title")} description={t("description")} />
        <ProfileForm
          initial={{
            name: user.name,
            middleName: user.middleName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber ?? "",
          }}
        />
        <EmailForm email={user.email ?? ""} />
        <PasswordForm />
        <OrganizationList
          organizations={memberships.map((membership) => ({
            id: membership.organization.id,
            name: membership.organization.name,
            slug: membership.organization.slug,
            role: membership.role,
            consented: membership.consentedAt !== null,
          }))}
        />
        <YourData />
      </main>
    </div>
  );
}
