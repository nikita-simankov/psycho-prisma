import { findPasswordReset } from "@/actions/auth/password-reset-action"
import { AuthShell } from "@/components/auth-shell"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { ResetPasswordForm } from "./reset-password-form"

export async function generateMetadata() {
  const t = await getTranslations("auth.reset")
  return { title: t("metaTitle") }
}

export default async function ResetPasswordPage({ params }: { params: { token: string } }) {
  const t = await getTranslations("auth.reset")

  if (!(await findPasswordReset(params.token))) {
    return (
      <AuthShell title={t("invalidTitle")} subtitle={t("invalidText")}>
        <Button asChild size="lg">
          <Link href="/auth/forgot-password">{t("requestNew")}</Link>
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <ResetPasswordForm token={params.token} />
    </AuthShell>
  )
}
