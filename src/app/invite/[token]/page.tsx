import { findInvitation } from "@/actions/invitation/accept-invitation-action"
import { logout } from "@/actions/auth/logout.action"
import { AuthShell } from "@/components/auth-shell"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { AcceptInvitationForm, JoinButton } from "./accept-invitation-form"

export async function generateMetadata() {
  const t = await getTranslations("invite")
  return { title: t("metaTitle") }
}

export default async function InvitePage({ params }: { params: { token: string } }) {
  const t = await getTranslations("invite")
  const common = await getTranslations("common")
  const invitation = await findInvitation(params.token)

  if (!invitation) {
    return (
      <AuthShell title={t("invalidTitle")} subtitle={t("invalidText")}>
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/sign-in">{common("signIn")}</Link>
        </Button>
      </AuthShell>
    )
  }

  const title = t("title", { organization: invitation.organization })

  switch (invitation.state) {
    case "new":
      return (
        <AuthShell title={title} subtitle={t("createAccount")}>
          <AcceptInvitationForm token={params.token} invitation={invitation} />
        </AuthShell>
      )
    case "signedIn":
      return (
        <AuthShell title={title} subtitle={t("signedInAs", { email: invitation.email })}>
          <JoinButton token={params.token} organization={invitation.organization} />
        </AuthShell>
      )
    case "existing":
      return (
        <AuthShell title={title} subtitle={t("existing", { email: invitation.email })}>
          <Button asChild size="lg">
            <Link href={`/auth/sign-in?next=/invite/${params.token}`}>{common("signIn")}</Link>
          </Button>
        </AuthShell>
      )
    case "otherUser":
      return (
        <AuthShell title={title} subtitle={t("otherUser", { email: invitation.email })}>
          <form action={logout}>
            <Button size="lg" variant="outline" className="w-full">
              {common("signOut")}
            </Button>
          </form>
        </AuthShell>
      )
  }
}
