import { AuthShell } from "@/components/auth-shell"
import { Button } from "@/components/ui/button"
import { getContext, homePath } from "@/utils/authentication"
import { findLinkAssignment } from "@/utils/round-links"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { redirect } from "next/navigation"

export async function generateMetadata() {
  const t = await getTranslations("roundLink")
  return { title: t("metaTitle") }
}

// Someone else is signed in on this browser: ask before switching accounts.
export default async function SwitchAccountPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params
  const t = await getTranslations("roundLink")
  const [assignment, context] = await Promise.all([findLinkAssignment(token), getContext()])

  if (!assignment) {
    redirect("/link-expired")
  }

  if (!context || context.user.id === assignment.userId) {
    redirect(`/r/${token}`)
  }

  const current = [context.user.name, context.user.lastName].filter(Boolean).join(" ") || context.user.email
  const stayHref = context.membership ? homePath(context.membership) : "/organizations/new"

  return (
    <AuthShell title={t("switchTitle", { name: assignment.user.name })} subtitle={t("switchText", { current: current ?? "", name: assignment.user.name })}>
      <div className="flex flex-col gap-3">
        <form action={`/r/${token}/continue`} method="post">
          <Button size="lg" className="w-full">
            {t("continueAs", { name: assignment.user.name })}
          </Button>
        </form>
        <Button asChild size="lg" variant="outline">
          <Link href={stayHref}>{t("stay", { current: current ?? "" })}</Link>
        </Button>
      </div>
    </AuthShell>
  )
}
