import { AuthShell } from "@/components/auth-shell";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/utils/authentication";
import { prisma } from "@/utils/database";
import { findJoinLink, joinLinkStatus } from "@/utils/join-links";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { JoinButton, JoinForm } from "./join-form";

export async function generateMetadata() {
  const t = await getTranslations("join");
  return { title: t("metaTitle") };
}

// A join link an admin shared. Anyone with it joins the organization as an employee.
export default async function JoinPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const t = await getTranslations("join");
  const common = await getTranslations("common");
  const link = token.length <= 100 ? await findJoinLink(token) : null;
  const status = link ? joinLinkStatus(link) : "invalid";

  if (!link || status !== "open") {
    return (
      <AuthShell title={t("closedTitle")} subtitle={t(`closed.${status === "open" ? "invalid" : status}`)}>
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/sign-in">{common("signIn")}</Link>
        </Button>
      </AuthShell>
    );
  }

  const organization = link.organization.name;
  const user = await getCurrentUser();

  if (user) {
    const member = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: link.organization.id } },
      select: { id: true },
    });
    return (
      <AuthShell
        title={t("title", { organization })}
        subtitle={member ? t("alreadyMember", { organization }) : t("signedInAs", { email: user.email ?? "" })}
      >
        <JoinButton token={token} organization={organization} />
      </AuthShell>
    );
  }

  const next = `/join/${token}`;
  return (
    <AuthShell title={t("title", { organization })} subtitle={t("text", { organization })}>
      <div className="flex w-full flex-col gap-6">
        <OAuthButtons next={next} />
        <JoinForm token={token} organization={organization} />
        <p className="text-center text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link href={`/auth/sign-in?next=${encodeURIComponent(next)}`} className="font-medium text-primary hover:underline">
            {common("signIn")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
